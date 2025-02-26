<script setup>
import { ref, computed, useSlots, onMounted } from 'vue'

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
  mask: {
    type: [String, Object],
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'input', 'validation', 'mounted'])

const inputRef = ref(null)
const isFocused = ref(false)
const error = ref('')

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
}

// Validation logic
const validate = (value) => {
  if (!props.rules.length) return true

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

  if (props.validateOnInput) {
    const isValid = validate(inputValue.value)
    emit('validation', { valid: isValid, error: error.value })
  }
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
        :id="id"
        ref="inputRef"
        :type="type"
        :value="inputValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="isRequired"
        :aria-required="isRequired"
        :maxlength="maxLength"
        class="base-input__field"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
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
    font-size: var(--input-label-font-size);
    font-weight: 500;
    color: var(--input-label-color, #374151);
  }

  &__required {
    color: var(--input-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  // Wrapper styles
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  // Input field styles
  &__field {
    width: 100%;
    padding: 0.625rem 0.75rem;
    font-size: var(--input-field-font-size);
    border-radius: 0.375rem;
    border: 1px solid var(--input-border-color, #d1d5db);
    background-color: var(--input-bg, white);
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: var(--input-focus-border-color, #3b82f6);
      box-shadow: 0 0 0 3px var(--input-focus-ring-color, rgba(59, 130, 246, 0.1));
    }

    &::placeholder {
      color: var(--input-placeholder-color, #9ca3af);
    }
  }

  // Prefix/Suffix styles
  &__prefix,
  &__suffix {
    position: absolute;
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    color: var(--input-icon-color, #6b7280);
  }

  &__prefix {
    left: 0;
  }

  &__suffix {
    right: 0;
  }

  &--with-prefix &__field {
    padding-left: 2.5rem;
  }

  &--with-suffix &__field {
    padding-right: 2.5rem;
  }

  // Helper text styles
  &__helper {
    font-size: var(--input-helper-font-size);
    color: var(--input-helper-color, #6b7280);
  }

  // Variants
  &--filled {
    .base-input__field {
      border: 1px solid transparent;
      background-color: var(--input-filled-bg, #f3f4f6);

      &:hover {
        background-color: var(--input-filled-hover-bg, #e5e7eb);
      }

      &:focus {
        background-color: var(--input-filled-focus-bg, #f9fafb);
        box-shadow: 0 0 0 3px var(--input-focus-ring-color, rgba(59, 130, 246, 0.1));
      }
    }
  }

  &--outlined &__field {
    border-width: 2px;
  }

  // States
  &--success {
    .base-input__field {
      border-color: var(--input-success-color, #22c55e) !important;

      &:focus {
        box-shadow: 0 0 0 3px var(--input-success-ring-color, rgba(34, 197, 94, 0.1));
      }
    }
    .base-input__helper {
      color: var(--input-success-color, #22c55e);
    }
  }

  &--error {
    .base-input__field {
      border-color: var(--input-error-color, #ef4444) !important;

      &:focus {
        box-shadow: 0 0 0 3px var(--input-error-ring-color, rgba(239, 68, 68, 0.1));
      }
    }
    .base-input__helper {
      color: var(--input-error-color, #ef4444);
    }
  }

  &--warning {
    .base-input__field {
      border-color: var(--input-warning-color, #f59e0b) !important;

      &:focus {
        box-shadow: 0 0 0 3px var(--input-warning-ring-color, rgba(245, 158, 11, 0.1));
      }
    }
    .base-input__helper {
      color: var(--input-warning-color, #f59e0b);
    }
  }

  // Disabled state
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;

    .base-input__field {
      cursor: not-allowed;
    }
  }
}
</style>
