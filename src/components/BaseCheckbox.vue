<script setup>
import { computed } from 'vue'
import { useAutoId } from '../composables/autoId'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [Boolean, Array],
    default: false,
  },
  value: {
    type: [String, Number, Boolean, Object],
    default: null,
  },
  label: {
    type: String,
    default: '',
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
  error: {
    type: Boolean,
    default: false,
  },
  indeterminate: {
    type: Boolean,
    default: false,
  },
})
const { autoId } = useAutoId('checkbox', props)

const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue.includes(props.value)
  }
  return props.modelValue
})

const handleChange = (event) => {
  if (Array.isArray(props.modelValue)) {
    const newValue = [...props.modelValue]
    if (event.target.checked) {
      newValue.push(props.value)
    } else {
      const index = newValue.indexOf(props.value)
      if (index > -1) newValue.splice(index, 1)
    }
    emit('update:modelValue', newValue)
  } else {
    emit('update:modelValue', event.target.checked)
  }
}
</script>

<template>
  <label
    :class="[
      'base-checkbox',
      `base-checkbox--${size}`,
      {
        'base-checkbox--disabled': disabled,
        'base-checkbox--error': error,
      },
    ]"
  >
    <input
      :id="autoId"
      type="checkbox"
      :checked="isChecked"
      :disabled="disabled"
      :indeterminate="indeterminate"
      class="base-checkbox__input"
      @change="handleChange"
    />
    <span class="base-checkbox__checkmark">
      <slot name="checkmark">
        <svg
          v-if="isChecked && !indeterminate"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-if="indeterminate"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.91675 7H11.0834"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </slot>
    </span>
    <span v-if="$slots.default || label" class="base-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style lang="scss">
.base-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;

  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  &__checkmark {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--checkbox-border);
    border-radius: var(--checkbox-border-radius);
    background-color: var(--checkbox-bg);
    color: var(--checkbox-check);
    transition: all 0.2s ease;

    svg {
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.2s ease;
    }
  }

  &__label {
    color: var(--checkbox-text);
  }

  // Sizes
  &--small {
    font-size: var(--checkbox-small-font-size);
    .base-checkbox__checkmark {
      width: 16px;
      height: 16px;
      svg {
        width: 12px;
        height: 12px;
      }
    }
  }

  &--medium {
    font-size: var(--checkbox-medium-font-size);
    .base-checkbox__checkmark {
      width: 20px;
      height: 20px;
      svg {
        width: 14px;
        height: 14px;
      }
    }
  }

  &--large {
    font-size: var(--checkbox-large-font-size);
    .base-checkbox__checkmark {
      width: 24px;
      height: 24px;
      svg {
        width: 16px;
        height: 16px;
      }
    }
  }

  // States
  input:checked + .base-checkbox__checkmark,
  input:indeterminate + .base-checkbox__checkmark {
    svg {
      opacity: 1;
      transform: scale(1);
    }
  }

  &:hover:not(.base-checkbox--disabled) {
    .base-checkbox__checkmark {
      border-color: var(--checkbox-hover-border-color, var(--checkbox-border-color));
    }
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &--error {
    --checkbox-hover-border-color: var(--input-error-color);
    .base-checkbox__checkmark {
      border-color: var(--input-error-color);
    }
    .base-checkbox__label {
      color: var(--input-error-color);
    }
  }

  input:focus-visible + .base-checkbox__checkmark {
    outline-offset: 2px;
  }
}
</style>
