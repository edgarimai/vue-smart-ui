<script setup lang="ts">
import { ref, computed, useSlots, onMounted, watch, nextTick } from 'vue'
import { useAutoId } from '../composables/autoId'
import { useValidationConfig } from '../composables/validationConfig'

export type InputVariant = 'default' | 'filled' | 'outlined'
export type InputState = 'success' | 'error' | 'warning'
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'YYYY/MM/DD'

export type ValidationRule =
  | string
  | Record<string, unknown>
  | { validator: (value: unknown) => boolean; message: string }

type MaskDefinition =
  | string
  | { patterns: string[]; match: (value: string) => number }
  | { pattern: string; format: (value: string | number) => string; parse: (value: string) => number }

interface Props {
  id?: string
  modelValue?: string | number
  transparentBg?: boolean
  variant?: InputVariant
  state?: InputState | null
  type?: string
  label?: string | null
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  helperText?: string | null
  errorMessage?: string | null
  prefixIcon?: string | null
  suffixIcon?: string | null
  rules?: ValidationRule[]
  validateOnBlur?: boolean
  validateOnInput?: boolean
  name?: string
  min?: number | string
  max?: number | string
  mask?: MaskDefinition | null
  rawValue?: boolean
  dateDisplayFormat?: DateFormat
  dateValueFormat?: DateFormat
  uppercase?: boolean
  lowercase?: boolean
}

const slots = useSlots()
const { getValidationMessage } = useValidationConfig()
const props = withDefaults(defineProps<Props>(), {
  id: '',
  modelValue: '',
  transparentBg: false,
  variant: 'default',
  state: null,
  type: 'text',
  label: null,
  placeholder: '',
  disabled: false,
  readonly: false,
  required: false,
  helperText: null,
  errorMessage: null,
  prefixIcon: null,
  suffixIcon: null,
  rules: () => [],
  validateOnBlur: true,
  validateOnInput: false,
  name: '',
  mask: null,
  rawValue: true,
  dateDisplayFormat: 'DD/MM/YYYY',
  dateValueFormat: 'YYYY-MM-DD',
  uppercase: false,
  lowercase: false,
})
const { autoId } = useAutoId('input', props)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: unknown]
  enter: [event: KeyboardEvent]
  validation: [payload: { valid: boolean; error: string; name?: string }]
  mounted: [payload: { validate: () => boolean; focus: () => void }]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const error = ref('')
const hasBeenValidated = ref(false)
const showPassword = ref(false)

const inputClasses = computed(() => ({
  'vsui base-input': true,
  [`base-input--${props.variant}`]: true,
  [`base-input--${inputState.value}`]: inputState.value,
  'base-input--disabled': props.disabled,
  'base-input--focused': isFocused.value,
  'base-input--with-prefix': props.prefixIcon || slots.prefix,
  'base-input--with-suffix': props.suffixIcon || slots.suffix || props.type === 'password',
}))

const inputType = computed(() => {
  if (props.type === 'password' && showPassword.value) return 'text'
  return props.type
})

const togglePasswordVisibility = (): void => {
  const cursorPosition = inputRef.value?.selectionStart

  showPassword.value = !showPassword.value

  if (cursorPosition !== undefined) {
    setTimeout(() => {
      inputRef.value?.setSelectionRange(cursorPosition as number, cursorPosition as number)
    }, 50)
  }
}

type ValidatorResult = { valid: boolean; message: string }
type ValidatorFn = (value: string | number, param?: string | number) => ValidatorResult

// Built-in validators
const validators: Record<string, ValidatorFn> = {
  required: (value) => ({
    valid: !!value?.toString().trim(),
    message: getValidationMessage('required'),
  }),
  email: (value) => ({
    valid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string),
    message: getValidationMessage('email'),
  }),
  min: (value, min) => ({
    valid: !value || (value as string).length >= (min as number),
    message: getValidationMessage('min', min),
  }),
  max: (value, max) => ({
    valid: !value || (value as string).length <= (max as number),
    message: getValidationMessage('max', max),
  }),
  pattern: (value, pattern) => ({
    valid: !value || new RegExp(pattern as string).test(value as string),
    message: getValidationMessage('pattern'),
  }),
  minValue: (value, min) => ({
    valid: !value || Number(value) >= (min as number),
    message: getValidationMessage('minValue', min),
  }),
  maxValue: (value, max) => ({
    valid: !value || Number(value) <= (max as number),
    message: getValidationMessage('maxValue', max),
  }),
  hexColor: (value) => ({
    valid: !value || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value as string),
    message: getValidationMessage('hexColor'),
  }),
  rgbColor: (value) => ({
    valid: !value || /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.test(value as string),
    message: getValidationMessage('rgbColor'),
  }),
  rgbaColor: (value) => ({
    valid:
      !value ||
      /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|0?\.\d+|1(\.0)?)\s*\)$/.test(
        value as string,
      ),
    message: getValidationMessage('rgbaColor'),
  }),
  hslColor: (value) => ({
    valid: !value || /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(value as string),
    message: getValidationMessage('hslColor'),
  }),
}

// Validation logic
const validate = (value: string | number): boolean => {
  if (!props.rules.length) return true

  hasBeenValidated.value = true
  for (const rule of props.rules) {
    if (typeof rule === 'string') {
      const validator = validators[rule]
      if (validator) {
        const result = validator(value)
        if (!result.valid) {
          error.value = result.message
          return false
        }
      }
      continue
    }

    if (typeof rule === 'object') {
      const [validatorName, config] = Object.entries(rule)[0]
      const validator = validators[validatorName]

      if (validator) {
        const result = validator(value, config as string | number)
        if (!result.valid) {
          error.value = (rule.message as string) || result.message
          return false
        }
      }

      if (typeof rule.validator === 'function') {
        const isValid = (rule.validator as (value: unknown) => boolean)(value)
        if (!isValid) {
          error.value = (rule.message as string) || 'Invalid value'
          return false
        }
      }
    }
  }

  error.value = ''
  return true
}

// Date format utilities
const parseDateByFormat = (
  dateString: string,
  format: string,
): { day: string | undefined; month: string | undefined; year: string | undefined } | null => {
  if (!dateString) return null

  const numbers = dateString.replace(/\D/g, '').substring(0, 8)
  if (numbers.length < 8) return null

  let day: string | undefined, month: string | undefined, year: string | undefined

  if (format === 'DD/MM/YYYY') {
    day = numbers.substring(0, 2)
    month = numbers.substring(2, 4)
    year = numbers.substring(4, 8)
  } else if (format === 'MM/DD/YYYY') {
    month = numbers.substring(0, 2)
    day = numbers.substring(2, 4)
    year = numbers.substring(4, 8)
  } else if (format === 'YYYY-MM-DD' || format === 'YYYY/MM/DD') {
    year = numbers.substring(0, 4)
    month = numbers.substring(4, 6)
    day = numbers.substring(6, 8)
  }

  return { day, month, year }
}

const formatDateByFormat = (
  day: string | undefined,
  month: string | undefined,
  year: string | undefined,
  format: string,
): string => {
  if (!day || !month || !year) return ''

  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`
  if (format === 'YYYY/MM/DD') return `${year}/${month}/${day}`

  return ''
}

const convertDateFormat = (dateString: string, fromFormat: string, toFormat: string): string => {
  if (!dateString) return ''

  const numbers = dateString.replace(/\D/g, '').substring(0, 8)
  if (numbers.length < 8) return ''

  const parsed = parseDateByFormat(dateString, fromFormat)
  if (!parsed) return ''

  return formatDateByFormat(parsed.day, parsed.month, parsed.year, toFormat)
}

// Built-in mask patterns
const maskPatterns = {
  phone: {
    patterns: ['(##) ####-####', '(##) #####-####'],
    match: (value: string) => {
      const numbers = value.replace(/\D/g, '')
      return numbers.length <= 10 ? 0 : 1
    },
  },
  currency: {
    pattern: 'currency',
    format: (value: string | number) => {
      if (!value && value !== 0) return ''

      const number = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value

      if (isNaN(number)) return ''

      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(number)
    },
    parse: (value: string) => {
      if (!value) return 0

      const numericValue = value.replace(/[^\d]/g, '')
      if (!numericValue) return 0

      const parsed = parseFloat(numericValue) / 100
      return isNaN(parsed) ? 0 : parsed
    },
  },
  date: '##/##/####',
  cpf: '###.###.###-##',
  cnpj: '##.###.###/####-##',
  cep: '#####-###',
}

const getMaskDefinition = (mask: MaskDefinition | null): MaskDefinition | null => {
  if (typeof mask === 'string') {
    if (mask === 'date') {
      const format = props.dateDisplayFormat
      if (format === 'DD/MM/YYYY') return '##/##/####'
      if (format === 'MM/DD/YYYY') return '##/##/####'
      if (format === 'YYYY-MM-DD') return '####-##-##'
      if (format === 'YYYY/MM/DD') return '####/##/##'
    }
    return (maskPatterns as Record<string, MaskDefinition>)[mask] || mask
  }
  return mask
}

const applyMask = (value: string, maskDef: MaskDefinition | null): string => {
  if (!value) return value

  // Handle currency mask
  if (maskDef === 'currency' || (maskDef as { pattern?: string } | null)?.pattern === 'currency') {
    const parsedValue = maskPatterns.currency.parse(value)
    return maskPatterns.currency.format(parsedValue)
  }

  // Handle simple string pattern
  if (typeof maskDef === 'string') return applySimpleMask(value, maskDef)

  // Handle multiple patterns
  if ((maskDef as { patterns?: string[] } | null)?.patterns) {
    const multi = maskDef as { patterns: string[]; match: (value: string) => number }
    const patternIndex = multi.match(value)
    return applySimpleMask(value, multi.patterns[patternIndex])
  }

  return value
}

const applyCase = (str: string): string => {
  if (!str) return str
  if (props.uppercase) return str.toUpperCase()
  if (props.lowercase) return str.toLowerCase()
  return str
}

const extractChars = (str: string, maskPattern: string): string => {
  const hasNumbers = maskPattern.includes('#')
  const hasLetters = maskPattern.includes('A')
  const hasAlphanumeric = maskPattern.includes('X')

  let cleaned = str
  if (hasAlphanumeric) cleaned = str.replace(/[^a-zA-Z0-9]/g, '')
  else if (hasLetters && hasNumbers) cleaned = str.replace(/[^a-zA-Z0-9]/g, '')
  else if (hasLetters) cleaned = str.replace(/[^a-zA-Z]/g, '')
  else if (hasNumbers) cleaned = str.replace(/\D/g, '')
  else cleaned = str

  return applyCase(cleaned)
}

const applySimpleMask = (value: string, pattern: string): string => {
  if (!pattern) return value

  const chars = extractChars(value, pattern).split('')

  let output = ''
  let charIndex = 0

  for (
    let patternIndex = 0;
    patternIndex < pattern.length && charIndex < chars.length;
    patternIndex++
  ) {
    const patternChar = pattern[patternIndex]

    if (patternChar === '#') {
      if (/\d/.test(chars[charIndex])) {
        output += chars[charIndex]
        charIndex++
      } else {
        break
      }
    } else if (patternChar === 'A') {
      if (/[a-zA-Z]/.test(chars[charIndex])) {
        output += chars[charIndex]
        charIndex++
      } else {
        break
      }
    } else if (patternChar === 'X') {
      if (/[a-zA-Z0-9]/.test(chars[charIndex])) {
        output += chars[charIndex]
        charIndex++
      } else {
        break
      }
    } else output += patternChar
  }

  return output
}

const removeMask = (value: string, maskDef: MaskDefinition | null): string | number => {
  if (!value) return value

  if (maskDef === 'currency' || (maskDef as { pattern?: string } | null)?.pattern === 'currency')
    return maskPatterns.currency.parse(value)

  if (typeof maskDef === 'string') {
    const hasNumbers = maskDef.includes('#')
    const hasLetters = maskDef.includes('A')
    const hasAlphanumeric = maskDef.includes('X')

    if (hasAlphanumeric) return value.replace(/[^a-zA-Z0-9]/g, '')
    if (hasLetters && hasNumbers) return value.replace(/[^a-zA-Z0-9]/g, '')
    if (hasLetters) return value.replace(/[^a-zA-Z]/g, '')
    if (hasNumbers) return value.replace(/\D/g, '')
  }

  return value.replace(/\D/g, '')
}

const inputValue = computed<string | number>({
  get: () => {
    if (!props.mask) {
      if (props.modelValue && (props.uppercase || props.lowercase)) {
        const strValue = String(props.modelValue)
        if (props.uppercase) return strValue.toUpperCase()
        if (props.lowercase) return strValue.toLowerCase()
      }
      return props.modelValue
    }
    if (!props.modelValue && props.modelValue !== 0) return props.modelValue

    const maskDef = getMaskDefinition(props.mask)

    if (props.mask === 'currency') return maskPatterns.currency.format(props.modelValue)

    if (props.mask === 'date' && props.rawValue) {
      const numbers = String(props.modelValue).replace(/\D/g, '')
      if (numbers.length >= 8) {
        const displayValue = convertDateFormat(
          props.modelValue as string,
          props.dateValueFormat,
          props.dateDisplayFormat,
        )
        if (displayValue) return displayValue
      }
      return applyMask(String(props.modelValue), maskDef) || ''
    }

    if (props.rawValue) {
      const masked = applyMask(String(props.modelValue), maskDef)
      return masked || ''
    }

    return props.modelValue
  },
  set: (value: string | number) => emit('update:modelValue', value),
})

const handleInput = (event: Event): void => {
  const newValue = (event.target as HTMLInputElement).value
  let valueToEmit: string | number = newValue

  if (props.mask) {
    const maskDef = getMaskDefinition(props.mask)
    const maskedValue = applyMask(newValue, maskDef)

    const safeValue = maskedValue || ''

    if (inputRef.value) inputRef.value.value = safeValue

    if (props.mask === 'date' && props.rawValue) {
      const numbers = safeValue.replace(/\D/g, '')
      if (numbers.length >= 8) {
        const convertedValue = convertDateFormat(
          safeValue,
          props.dateDisplayFormat,
          props.dateValueFormat,
        )
        valueToEmit = convertedValue || removeMask(newValue, maskDef)
      } else {
        valueToEmit = removeMask(newValue, maskDef)
      }
    } else {
      valueToEmit = props.rawValue ? removeMask(newValue, maskDef) : safeValue
    }
  } else {
    if (props.uppercase) {
      valueToEmit = newValue.toUpperCase()
      if (inputRef.value) inputRef.value.value = valueToEmit
    } else if (props.lowercase) {
      valueToEmit = newValue.toLowerCase()
      if (inputRef.value) inputRef.value.value = valueToEmit
    }
  }

  if (props.type === 'email' && valueToEmit) valueToEmit = (valueToEmit as string).toLowerCase()

  emit('update:modelValue', valueToEmit)
  emit('input', { ...event, target: { ...event.target, value: newValue } })

  if (props.validateOnInput || hasBeenValidated.value) {
    const isValid = validate(valueToEmit)
    emit('validation', { valid: isValid, error: error.value })
  }
}

const handleEnter = (event: KeyboardEvent): void => {
  emit('enter', event)
}

const handleFocus = (event: FocusEvent): void => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent): void => {
  isFocused.value = false
  emit('blur', event)

  if (props.validateOnBlur) {
    const isValid = validate(inputValue.value)
    emit('validation', { valid: isValid, error: error.value })
  }
}

const focus = (): void => {
  inputRef.value?.focus()
}

const inputState = computed(() => {
  if (error.value) return 'error'
  return props.state
})

const displayMessage = computed(() => {
  if (error.value) return error.value
  return props.errorMessage || props.helperText
})

const validateField = (): boolean => {
  const isValid = validate(inputValue.value)
  emit('validation', { valid: isValid, error: error.value, name: props.name })
  return isValid
}

const isRequired = computed(() => {
  if (props.required) return true

  return props.rules.some((rule) => {
    if (rule === 'required') return true
    if (typeof rule === 'object') {
      return (rule as Record<string, unknown>).required || Object.keys(rule)[0] === 'required'
    }
    return false
  })
})

const maxLength = computed<number | undefined>(() => {
  if (!props.mask) return undefined

  const maskDef = getMaskDefinition(props.mask)

  if (typeof maskDef === 'string') return maskDef.length

  if ((maskDef as { patterns?: string[] } | null)?.patterns) {
    const multi = maskDef as { patterns: string[] }
    return Math.max(...multi.patterns.map((pattern) => pattern.length))
  }

  return undefined
})

const applyMaskToInput = (): void => {
  if (!props.mask || !inputRef.value) return
  if (!props.modelValue && props.modelValue !== 0) return

  const maskDef = getMaskDefinition(props.mask)

  let maskedValue: string
  if (props.mask === 'currency') {
    maskedValue = maskPatterns.currency.format(props.modelValue)
  } else if (props.mask === 'date' && props.rawValue) {
    const numbers = String(props.modelValue).replace(/\D/g, '')
    if (numbers.length >= 8) {
      maskedValue = convertDateFormat(
        props.modelValue as string,
        props.dateValueFormat,
        props.dateDisplayFormat,
      )
    } else {
      maskedValue = applyMask(String(props.modelValue), maskDef)
    }
  } else {
    maskedValue = applyMask(String(props.modelValue), maskDef)
  }

  const safeValue = maskedValue || ''

  if (inputRef.value.value !== safeValue) inputRef.value.value = safeValue
}

watch(
  () => props.modelValue,
  () => {
    nextTick(() => {
      applyMaskToInput()
    })
  },
)

onMounted(() => {
  applyMaskToInput()

  emit('mounted', {
    validate: validateField,
    focus,
  })
})
</script>

<template>
  <div :class="inputClasses">
    <label v-if="label" class="base-input__label">
      {{ label }}
      <span v-if="isRequired" class="base-input__required" aria-hidden="true">*</span>
    </label>

    <div class="base-input__wrapper" :class="{ 'base-input__wrapper--transparent': transparentBg }">
      <div v-if="$slots.prefix || prefixIcon" class="base-input__prefix">
        <slot name="prefix">
          <i :class="prefixIcon"></i>
        </slot>
      </div>

      <input
        :id="autoId"
        ref="inputRef"
        :type="inputType"
        :value="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="isRequired"
        :aria-required="isRequired"
        :maxlength="maxLength"
        :min="min"
        :max="max"
        class="base-input__field"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
      />

      <div v-if="$slots.suffix || suffixIcon || type === 'password'" class="base-input__suffix">
        <slot name="suffix">
          <i v-if="suffixIcon" :class="suffixIcon"></i>
        </slot>
        <button
          v-if="type === 'password'"
          type="button"
          class="base-input__password-toggle"
          tabindex="-1"
          @click="togglePasswordVisibility"
          @mousedown.prevent
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
        >
          <svg
            v-if="showPassword"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
            />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="displayMessage"
      class="base-input__helper"
      :class="{ 'base-input__helper--error': error }"
    >
      {{ displayMessage }}
    </div>
  </div>
</template>

<style lang="scss">
.base-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  // Label styles
  &__label {
    font-size: var(--vsui-input-label-font-size);
    font-weight: 500;
    color: var(--vsui-input-label-color, #374151);
  }

  &__required {
    color: var(--vsui-input-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  // Wrapper styles
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    border-radius: 0.375rem;
    border: 1px solid var(--vsui-input-border-color, #d1d5db);
    background-color: var(--vsui-input-bg, white);
    transition: all 0.2s;
  }

  &__wrapper--transparent {
    background-color: transparent;
  }

  // Input field styles
  &__field {
    flex: 1;
    width: 100%;
    padding: 0.625rem 0.75rem;
    font-size: var(--vsui-input-field-font-size);
    border: none;
    background-color: transparent;
    color: var(--vsui-input-text-color, #374151);
    font-family: var(--vsui-font-family-base, inherit);

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: var(--vsui-input-placeholder-color, #9ca3af);
    }
  }

  // Prefix/Suffix styles
  &__prefix,
  &__suffix {
    display: flex;
    align-items: center;
    color: var(--vsui-input-icon-color, #6b7280);
    z-index: 1;
  }

  &__prefix {
    padding-right: 0;
  }

  &__suffix {
    padding-left: 0;
  }

  &__password-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--vsui-input-icon-color, #6b7280);
    padding: 0;
    margin: 0;
    transition: color 0.2s;
    padding: 0 0.75rem;

    &:hover {
      color: var(--vsui-input-text-color, #374151);
    }

    &:focus {
      outline: none;
    }

    svg {
      display: block;
    }
  }

  // Helper text styles
  &__helper {
    font-size: var(--vsui-input-helper-font-size);
    color: var(--vsui-input-helper-color, #6b7280);
  }

  // States
  &--success {
    .base-input__wrapper {
      border-color: var(--vsui-input-success-color, #22c55e) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-input-success-ring-color, rgba(34, 197, 94, 0.1));
      }
    }
    .base-input__helper {
      color: var(--vsui-input-success-color, #22c55e);
    }
  }

  &--error {
    .base-input__wrapper {
      border-color: var(--vsui-input-error-color, #ef4444) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-input-error-ring-color, rgba(239, 68, 68, 0.1));
      }
    }
    .base-input__helper {
      color: var(--vsui-input-error-color, #ef4444);
    }
  }

  &--warning {
    .base-input__wrapper {
      border-color: var(--vsui-input-warning-color, #f59e0b) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-input-warning-ring-color, rgba(245, 158, 11, 0.1));
      }
    }
    .base-input__helper {
      color: var(--vsui-input-warning-color, #f59e0b);
    }
  }

  &__wrapper:focus-within {
    border-color: var(--vsui-input-focus-border-color, #3b82f6);
    box-shadow: 0 0 0 3px var(--vsui-input-focus-ring-color, rgba(59, 130, 246, 0.1));
  }

  // Variants
  &--filled {
    .base-input__wrapper {
      background-color: var(--vsui-input-filled-bg, #f3f4f6);
      border-color: transparent;

      &:hover {
        background-color: var(--vsui-input-filled-hover-bg, #e5e7eb);
      }

      &:focus-within {
        background-color: var(--vsui-input-filled-focus-bg, #f9fafb);
      }
    }
  }

  &--outlined &__wrapper {
    border-width: 2px;
  }

  // Disabled state
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;

    .base-input__field {
      cursor: not-allowed;
    }

    .base-input__prefix button,
    .base-input__prefix [role='button'],
    .base-input__suffix button,
    .base-input__suffix [role='button'] {
      pointer-events: none;
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
