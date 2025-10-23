<script setup>
import { ref, computed, useSlots, onMounted } from 'vue'
import { useAutoId } from '../composables/autoId'

const slots = useSlots()
const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number],
    default: '',
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'filled', 'outlined'].includes(value),
  },
  state: {
    type: String,
    default: null,
    validator: (value) => ['success', 'error', 'warning'].includes(value),
  },
  type: {
    type: String,
    default: 'text',
  },
  label: {
    type: String,
    default: null,
  },
  placeholder: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  helperText: {
    type: String,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  prefixIcon: {
    type: String,
    default: null,
  },
  suffixIcon: {
    type: String,
    default: null,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  validateOnBlur: {
    type: Boolean,
    default: true,
  },
  validateOnInput: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: '',
  },
  min: {
    type: [Number, String],
    default: null,
  },
  max: {
    type: [Number, String],
    default: null,
  },
  mask: {
    type: [String, Object],
    default: null,
  },
})
const { autoId } = useAutoId('input', props)

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'input', 'validation', 'mounted'])

const inputRef = ref(null)
const isFocused = ref(false)
const error = ref('')
const hasBeenValidated = ref(false)

const inputClasses = computed(() => ({
  'vsui base-input': true,
  [`base-input--${props.variant}`]: true,
  [`base-input--${inputState.value}`]: inputState.value,
  'base-input--disabled': props.disabled,
  'base-input--focused': isFocused.value,
  'base-input--with-prefix': props.prefixIcon || slots.prefix,
  'base-input--with-suffix': props.suffixIcon || slots.suffix,
}))

// Built-in validators
const validators = {
  required: (value) => ({
    valid: !!value?.toString().trim(),
    message: 'This field is required',
  }),
  email: (value) => ({
    valid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email',
  }),
  min: (value, min) => ({
    valid: !value || value.length >= min,
    message: `Must be at least ${min} characters`,
  }),
  max: (value, max) => ({
    valid: !value || value.length <= max,
    message: `Must be no more than ${max} characters`,
  }),
  pattern: (value, pattern) => ({
    valid: !value || new RegExp(pattern).test(value),
    message: 'Invalid format',
  }),
  minValue: (value, min) => ({
    valid: !value || Number(value) >= min,
    message: `Value must be at least ${min}`,
  }),
  maxValue: (value, max) => ({
    valid: !value || Number(value) <= max,
    message: `Value must be no more than ${max}`,
  }),
  hexColor: (value) => ({
    valid: !value || /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value),
    message: 'Invalid HEX color',
  }),
  rgbColor: (value) => ({
    valid: !value || /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/.test(value),
    message: 'Invalid RGB color',
  }),
  rgbaColor: (value) => ({
    valid:
      !value ||
      /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|0?\.\d+|1(\.0)?)\s*\)$/.test(
        value,
      ),
    message: 'Invalid RGBA color',
  }),
  hslColor: (value) => ({
    valid: !value || /^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/.test(value),
    message: 'Invalid HSL color',
  }),
}

// Validation logic
const validate = (value) => {
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
      console.log(validatorName, config)
      const validator = validators[validatorName]

      if (validator) {
        const result = validator(value, config)
        if (!result.valid) {
          error.value = rule.message || result.message
          return false
        }
      }

      if (typeof rule.validator === 'function') {
        const isValid = rule.validator(value)
        if (!isValid) {
          error.value = rule.message || 'Invalid value'
          return false
        }
      }
    }
  }

  error.value = ''
  return true
}

// Internal value to track input
const inputValue = computed({
  get: () => {
    if (props.mask === 'currency' && props.modelValue) {
      return maskPatterns.currency.format(props.modelValue)
    }
    return props.modelValue
  },
  set: (value) => emit('update:modelValue', value),
})

// Built-in mask patterns
const maskPatterns = {
  phone: {
    patterns: ['(##) ####-####', '(##) #####-####'],
    match: (value) => {
      const numbers = value.replace(/\D/g, '')
      return numbers.length <= 10 ? 0 : 1
    },
  },
  currency: {
    pattern: 'currency',
    format: (value) => {
      if (!value) return ''

      const number = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value

      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(number)
    },
    parse: (value) => {
      const numericValue = value.replace(/[^\d]/g, '')
      return parseFloat(numericValue) / 100
    },
  },
  date: '##/##/####',
  cpf: '###.###.###-##',
  cnpj: '##.###.###/####-##',
  cep: '#####-###',
}

const applyMask = (value, maskDef) => {
  if (!value) return value

  // Handle currency mask
  if (maskDef === 'currency' || maskDef.pattern === 'currency') {
    const parsedValue = maskPatterns.currency.parse(value)
    return maskPatterns.currency.format(parsedValue)
  }

  // Handle simple string pattern
  if (typeof maskDef === 'string') {
    return applySimpleMask(value, maskDef)
  }

  // Handle multiple patterns
  if (maskDef.patterns) {
    const patternIndex = maskDef.match(value)
    return applySimpleMask(value, maskDef.patterns[patternIndex])
  }

  return value
}

const applySimpleMask = (value, pattern) => {
  if (!pattern) return value

  const numbers = value.replace(/\D/g, '')
  const chars = numbers.split('')
  let output = ''
  let patternIndex = 0

  for (let i = 0; i < pattern.length && chars[i]; i++) {
    if (pattern[patternIndex] === '#') {
      output += chars[i]
      patternIndex++
    } else {
      output += pattern[patternIndex]
      patternIndex++
      i--
    }
  }

  return output
}

const handleInput = (event) => {
  let newValue = event.target.value

  if (props.mask) {
    const maskDef =
      typeof props.mask === 'string' ? maskPatterns[props.mask] || props.mask : props.mask.pattern

    newValue = applyMask(newValue, maskDef)

    if (inputRef.value) {
      inputRef.value.value = newValue
    }
  }

  if (props.mask === 'currency') {
    const parsedValue = maskPatterns.currency.parse(newValue)
    inputValue.value = parsedValue
    emit('update:modelValue', parsedValue)
  } else {
    inputValue.value = newValue
    emit('update:modelValue', newValue)
  }

  emit('input', { ...event, target: { ...event.target, value: newValue } })

  if (props.validateOnInput || hasBeenValidated.value) {
    const isValid = validate(inputValue.value)
    emit('validation', { valid: isValid, error: error.value })
  }
}

const handleEnter = (event) => {
  isFocused.value = true
  emit('enter', event)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)

  if (props.validateOnBlur) {
    const isValid = validate(inputValue.value)
    emit('validation', { valid: isValid, error: error.value })
  }
}

const focus = () => {
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

const validateField = () => {
  const isValid = validate(inputValue.value)
  emit('validation', { valid: isValid, error: error.value, name: props.name })
  return isValid
}

const isRequired = computed(() => {
  if (props.required) return true

  return props.rules.some((rule) => {
    if (rule === 'required') return true
    if (typeof rule === 'object') {
      return rule.required || Object.keys(rule)[0] === 'required'
    }
    return false
  })
})

const maxLength = computed(() => {
  if (!props.mask) return undefined

  const maskDef =
    typeof props.mask === 'string' ? maskPatterns[props.mask] || props.mask : props.mask.pattern

  if (typeof maskDef === 'string') {
    return maskDef.length
  }

  if (maskDef.patterns) {
    return Math.max(...maskDef.patterns.map((pattern) => pattern.length))
  }

  return undefined
})

onMounted(() => {
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

    <div class="base-input__wrapper">
      <div v-if="$slots.prefix || prefixIcon" class="base-input__prefix">
        <slot name="prefix">
          <i :class="prefixIcon"></i>
        </slot>
      </div>

      <input
        :id="autoId"
        ref="inputRef"
        :type="type"
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

      <div v-if="$slots.suffix || suffixIcon" class="base-input__suffix">
        <slot name="suffix">
          <i :class="suffixIcon"></i>
        </slot>
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
    padding: 0 0.75rem;
    color: var(--vsui-input-icon-color, #6b7280);
    z-index: 1;
  }

  &__prefix {
    padding-right: 0;
  }

  &__suffix {
    padding-left: 0;
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
