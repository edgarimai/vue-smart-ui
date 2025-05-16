<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAutoId } from '../composables/autoId'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number, Array],
    default: () => [],
  },
  options: {
    type: Array,
    default: () => [],
    required: true,
  },
  valueKey: {
    type: String,
    default: 'value',
  },
  labelKey: {
    type: String,
    default: 'label',
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'gray'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: null,
  },
  helperText: {
    type: String,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  validateOnChange: {
    type: Boolean,
    default: true,
  },
})

const { autoId } = useAutoId('segmented-buttons', props)
const emit = defineEmits(['update:modelValue', 'change', 'validation', 'mounted'])

const error = ref('')
const touched = ref(false)

// Built-in validators
const validators = {
  required: (value) => ({
    valid: Array.isArray(value) ? value.length > 0 : !!value,
    message: 'This field is required',
  }),
  min: (value, min) => ({
    valid: !Array.isArray(value) || value.length >= min,
    message: `Select at least ${min} option${min > 1 ? 's' : ''}`,
  }),
  max: (value, max) => ({
    valid: !Array.isArray(value) || value.length <= max,
    message: `Select no more than ${max} option${max > 1 ? 's' : ''}`,
  }),
}

// Validation logic
const validate = (value) => {
  if (!props.rules.length) return true

  for (const rule of props.rules) {
    if (typeof rule === 'string') {
      if (rule.includes(':')) {
        const [validatorName, param] = rule.split(':')
        const validator = validators[validatorName]

        if (validator) {
          const result = validator(value, parseInt(param, 10))
          if (!result.valid) {
            error.value = result.message
            return false
          }
        }
      } else if (validators[rule]) {
        const result = validators[rule](value)
        if (!result.valid) {
          error.value = result.message
          return false
        }
      }
      continue
    }

    if (typeof rule === 'object') {
      if (rule.message) {
        let validatorName, param

        for (const key in rule) {
          if (key !== 'message') {
            validatorName = key
            param = rule[key]
            break
          }
        }

        const validator = validators[validatorName]
        if (validator) {
          const result = validator(value, param)
          if (!result.valid) {
            error.value = rule.message || result.message
            return false
          }
        }
      } else if (typeof rule.validator === 'function') {
        const isValid = rule.validator(value)
        if (!isValid) {
          error.value = rule.message || 'Invalid selection'
          return false
        }
      }
    }
  }

  error.value = ''
  return true
}

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value)

    if (props.validateOnChange) {
      touched.value = true
      const isValid = validate(value)
      emit('validation', { valid: isValid, error: error.value })
    }
  },
})

const containerClasses = computed(() => ({
  'vsui base-segmented-buttons': true,
  [`base-segmented-buttons--${props.size}`]: true,
  'base-segmented-buttons--block': props.block,
  'base-segmented-buttons--disabled': props.disabled,
  'base-segmented-buttons--error': error.value && touched.value,
}))

const getValue = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.valueKey]
  }
  return option
}

const getLabel = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.labelKey] || option[props.valueKey] || String(option)
  }
  return option
}

const isSelected = (option) => {
  const optionValue = getValue(option)

  if (props.multiple) {
    if (!Array.isArray(props.modelValue)) return false

    if (typeof props.modelValue[0] === 'object' && props.modelValue[0] !== null) {
      return props.modelValue.some((item) => getValue(item) === optionValue)
    } else {
      return props.modelValue.includes(optionValue)
    }
  } else {
    if (props.modelValue === null) return false

    if (typeof props.modelValue === 'object' && props.modelValue !== null) {
      return getValue(props.modelValue) === optionValue
    } else {
      return props.modelValue === optionValue
    }
  }
}

const selectOption = (option) => {
  if (props.disabled) return

  const optionValue = getValue(option)
  const isObjectOption = typeof props.options[0] === 'object' && props.options[0] !== null

  if (!props.multiple) {
    selectedValue.value = isSelected(option) ? null : isObjectOption ? option : optionValue
    return
  }

  const newValue = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const isAlreadySelected = isSelected(option)

  if (isAlreadySelected) {
    if (typeof newValue[0] === 'object' && newValue[0] !== null)
      newValue.splice(
        newValue.findIndex((item) => getValue(item) === optionValue),
        1,
      )
    else newValue.splice(newValue.indexOf(optionValue), 1)
  } else newValue.push(isObjectOption ? option : optionValue)

  selectedValue.value = newValue
}

const isRequired = computed(() => {
  return props.rules.some((rule) => {
    if (rule === 'required') return true
    if (typeof rule === 'object') {
      return rule.required || Object.keys(rule)[0] === 'required'
    }
    return false
  })
})

const displayMessage = computed(() => {
  if (error.value && touched.value) return error.value
  return props.errorMessage || props.helperText
})

const validateField = () => {
  touched.value = true
  const isValid = validate(selectedValue.value)
  emit('validation', { valid: isValid, error: error.value })
  return isValid
}

onMounted(() => {
  emit('mounted', {
    validate: validateField,
  })
})
</script>

<template>
  <div class="base-segmented-buttons-wrapper">
    <label v-if="label" class="base-segmented-buttons__label">
      {{ label }}
      <span v-if="isRequired" class="base-segmented-buttons__required">*</span>
    </label>

    <div :id="autoId" :class="containerClasses">
      <button
        v-for="(option, index) in options"
        :key="index"
        type="button"
        class="base-segmented-buttons__button"
        :class="[
          `base-segmented-buttons__button--${variant}`,
          {
            'base-segmented-buttons__button--selected': isSelected(option),
            'base-segmented-buttons__button--first': index === 0,
            'base-segmented-buttons__button--last': index === options.length - 1,
            'base-segmented-buttons__button--middle': index > 0 && index < options.length - 1,
          },
        ]"
        :disabled="disabled"
        @click="selectOption(option)"
      >
        {{ getLabel(option) }}
      </button>
    </div>

    <div
      v-if="displayMessage"
      class="base-segmented-buttons__helper"
      :class="{ 'base-segmented-buttons__helper--error': error && touched }"
    >
      {{ displayMessage }}
    </div>
  </div>
</template>

<style lang="scss">
.base-segmented-buttons-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.base-segmented-buttons {
  display: inline-flex;
  align-items: center;

  &__label {
    font-size: var(--input-label-font-size, 0.875rem);
    font-weight: 500;
    color: var(--input-label-color, #374151);
  }

  &__required {
    color: var(--input-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  &__helper {
    font-size: var(--input-helper-font-size, 0.75rem);
    color: var(--input-helper-color, #6b7280);
    margin-top: 0.25rem;

    &--error {
      color: var(--input-error-color, #ef4444);
    }
  }

  &--block {
    width: 100%;
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &--error {
    .base-segmented-buttons__button {
      border-color: var(--input-error-color, #ef4444);
    }
  }

  &__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    transition: all 0.2s ease;
    border: 1px solid var(--button-outline-border, #d1d5db);
    background-color: transparent;
    cursor: pointer;
    margin: 0;
    position: relative;

    &:focus {
      outline: 2px solid var(--button-focus-outline, rgba(59, 130, 246, 0.5));
      outline-offset: 2px;
      z-index: 2;
    }

    // First button
    &--first {
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;
    }

    // Last button
    &--last {
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
    }

    // Middle buttons
    &--middle {
      border-left: none;
    }

    &--last:not(&--first) {
      border-left: none;
    }

    // Selected state
    &--selected {
      z-index: 1;
    }

    // Primary variant
    &--primary {
      color: var(--button-outline-text, #374151);

      &:hover:not(:disabled):not(.base-segmented-buttons__button--selected) {
        background-color: var(--button-outline-hover, rgba(229, 231, 235, 0.5));
      }

      &.base-segmented-buttons__button--selected {
        background-color: var(--button-primary-bg, #3b82f6);
        color: var(--button-primary-text, white);
        border-color: var(--button-primary-bg, #3b82f6);
      }
    }

    // Secondary variant
    &--secondary {
      color: var(--button-outline-text, #374151);

      &:hover:not(:disabled):not(.base-segmented-buttons__button--selected) {
        background-color: var(--button-outline-hover, rgba(229, 231, 235, 0.5));
      }

      &.base-segmented-buttons__button--selected {
        background-color: var(--button-secondary-bg, #6b7280);
        color: var(--button-secondary-text, white);
        border-color: var(--button-secondary-bg, #6b7280);
      }
    }

    // Gray variant
    &--gray {
      color: var(--button-outline-text, #374151);

      &:hover:not(:disabled):not(.base-segmented-buttons__button--selected) {
        background-color: var(--button-outline-hover, rgba(229, 231, 235, 0.5));
      }

      &.base-segmented-buttons__button--selected {
        background-color: var(--button-gray-bg, #e5e7eb);
        color: var(--button-gray-text, #111827);
        border-color: var(--button-gray-bg, #e5e7eb);
      }
    }
  }

  // Size variants
  &--small &__button {
    height: 2rem;
    padding: 0 0.75rem;
    font-size: 0.75rem;
  }

  &--medium &__button {
    height: 2.5rem;
    padding: 0 1rem;
    font-size: 0.875rem;
  }

  &--large &__button {
    height: 3rem;
    padding: 0 1.25rem;
    font-size: 1rem;
  }
}
</style>
