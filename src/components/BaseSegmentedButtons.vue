<script setup>
import { computed } from 'vue'
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
})

const { autoId } = useAutoId('segmented-buttons', props)
const emit = defineEmits(['update:modelValue', 'change'])

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value)
  },
})

const containerClasses = computed(() => ({
  'vsui base-segmented-buttons': true,
  [`base-segmented-buttons--${props.size}`]: true,
  'base-segmented-buttons--block': props.block,
  'base-segmented-buttons--disabled': props.disabled,
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
</script>

<template>
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
</template>

<style lang="scss">
.base-segmented-buttons {
  display: inline-flex;
  align-items: center;

  &--block {
    width: 100%;
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
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
        background-color: var(--button-gray-bg, #f3f4f6);
        color: var(--button-gray-text, #111827);
        border-color: var(--button-gray-bg, #f3f4f6);
      }
    }

    // Outline variant
    &--outline {
      color: var(--button-outline-text, #374151);

      &:hover:not(:disabled):not(.base-segmented-buttons__button--selected) {
        background-color: var(--button-outline-hover, rgba(229, 231, 235, 0.5));
      }

      &.base-segmented-buttons__button--selected {
        background-color: transparent;
        color: var(--button-outline-text, #374151);
        border-color: var(--button-outline-border, #d1d5db);
        box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);
      }
    }

    // Ghost variant
    &--ghost {
      border-color: transparent;
      color: var(--button-ghost-text, #4b5563);

      &:hover:not(:disabled):not(.base-segmented-buttons__button--selected) {
        background-color: var(--button-ghost-hover, rgba(229, 231, 235, 0.3));
      }

      &.base-segmented-buttons__button--selected {
        background-color: var(--button-ghost-hover, rgba(229, 231, 235, 0.6));
        color: var(--button-ghost-text, #4b5563);
      }
    }
  }

  // Sizes
  &--small &__button {
    padding: 0.5rem 1rem;
    font-size: var(--button-small-font-size, 0.875rem);
  }

  &--medium &__button {
    padding: 0.75rem 1.5rem;
    font-size: var(--button-medium-font-size, 1rem);
  }

  &--large &__button {
    padding: 1rem 2rem;
    font-size: var(--button-large-font-size, 1.125rem);
  }

  // Block variant distributes buttons evenly
  &--block &__button {
    flex: 1;
  }
}
</style>
