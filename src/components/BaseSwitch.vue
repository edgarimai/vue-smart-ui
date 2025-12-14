<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAutoId } from '../composables/autoId'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [Boolean, String, Number],
    default: false,
  },
  onValue: {
    type: [Boolean, String, Number],
    default: true,
  },
  offValue: {
    type: [Boolean, String, Number],
    default: false,
  },
  label: {
    type: String,
    default: null,
  },
  labelPosition: {
    type: String,
    default: 'right',
    validator: (value) => ['top', 'left', 'right'].includes(value),
  },
  disabled: {
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
  state: {
    type: String,
    default: null,
    validator: (value) => ['success', 'error', 'warning'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'filled'].includes(value),
  },
  onLabel: {
    type: String,
    default: null,
  },
  offLabel: {
    type: String,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'mounted'])

const { autoId } = useAutoId('switch', props)

const switchValue = ref(props.modelValue)
const isFocused = ref(false)

const isOn = computed(() => switchValue.value === props.onValue)

const switchClasses = computed(() => ({
  'vsui base-switch': true,
  [`base-switch--${props.size}`]: true,
  [`base-switch--${props.variant}`]: true,
  [`base-switch--${props.state}`]: props.state,
  [`base-switch--label-${props.labelPosition}`]: props.label,
  'base-switch--disabled': props.disabled || props.loading,
  'base-switch--loading': props.loading,
  'base-switch--focused': isFocused.value,
  'base-switch--on': isOn.value,
}))

const displayMessage = computed(() => {
  return props.errorMessage || props.helperText
})

watch(
  () => props.modelValue,
  (newValue) => {
    switchValue.value = newValue
  },
)

const toggle = () => {
  if (props.disabled || props.loading) return

  switchValue.value = isOn.value ? props.offValue : props.onValue
  emit('update:modelValue', switchValue.value)
  emit('change', switchValue.value)
}

const handleKeyDown = (event) => {
  if (props.disabled || props.loading) return

  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    toggle()
  }
}

const handleFocus = () => {
  isFocused.value = true
}

const handleBlur = () => {
  isFocused.value = false
}

onMounted(() => {
  emit('mounted', {
    id: autoId.value,
    getValue: () => switchValue.value,
    setValue: (val) => {
      switchValue.value = val
      emit('update:modelValue', val)
    },
  })
})
</script>

<template>
  <div :class="switchClasses">
    <div class="base-switch__wrapper-container">
      <label
        v-if="label && labelPosition === 'top'"
        :for="autoId"
        class="base-switch__label base-switch__label--top"
      >
        {{ label }}
        <span v-if="required" class="base-switch__required" aria-hidden="true">*</span>
      </label>

      <div class="base-switch__container">
        <label
          v-if="label && labelPosition === 'left'"
          :for="autoId"
          class="base-switch__label base-switch__label--left"
        >
          {{ label }}
          <span v-if="required" class="base-switch__required" aria-hidden="true">*</span>
        </label>

        <label :for="autoId" class="base-switch__wrapper">
          <input
            :id="autoId"
            ref="switchRef"
            type="checkbox"
            :checked="isOn"
            :disabled="disabled || loading"
            :required="required"
            :aria-required="required"
            :aria-checked="isOn"
            :name="name"
            class="base-switch__input"
            @change="toggle"
            @focus="handleFocus"
            @blur="handleBlur"
            @keydown="handleKeyDown"
          />

          <div class="base-switch__track">
            <div class="base-switch__thumb">
              <div v-if="loading" class="base-switch__spinner"></div>
            </div>

            <span
              v-if="onLabel && isOn"
              class="base-switch__track-label base-switch__track-label--on"
            >
              {{ onLabel }}
            </span>
            <span
              v-if="offLabel && !isOn"
              class="base-switch__track-label base-switch__track-label--off"
            >
              {{ offLabel }}
            </span>
          </div>
        </label>

        <label
          v-if="label && labelPosition === 'right'"
          :for="autoId"
          class="base-switch__label base-switch__label--right"
        >
          {{ label }}
          <span v-if="required" class="base-switch__required" aria-hidden="true">*</span>
        </label>
      </div>
    </div>

    <div
      v-if="displayMessage"
      class="base-switch__helper"
      :class="{ 'base-switch__helper--error': state === 'error' || errorMessage }"
    >
      {{ displayMessage }}
    </div>
  </div>
</template>

<style lang="scss">
.base-switch {
  font-family: var(--vsui-font-family-base);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &__wrapper-container {
    display: flex;
  }

  &__container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
  }

  &__input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  &__track {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: var(--vsui-switch-track-radius, 9999px);
    background-color: var(--vsui-switch-track-bg, #e5e7eb);
    transition: background-color 0.2s ease;
  }

  &__thumb {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: var(--vsui-switch-thumb-bg, #ffffff);
    box-shadow: var(--vsui-switch-thumb-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
    transition: transform 0.2s ease;
    z-index: 1;
  }

  &__track-label {
    font-size: var(--vsui-switch-track-label-font-size, 0.75rem);
    font-weight: 500;
    user-select: none;
    pointer-events: none;
    line-height: 1;

    &--on {
      margin-left: 0.5rem;
      color: var(--vsui-switch-track-label-on-color, #ffffff);
    }

    &--off {
      margin-left: auto;
      margin-right: 0.5rem;
      color: var(--vsui-switch-track-label-off-color, #6b7280);
    }
  }

  &__label {
    font-size: var(--vsui-switch-label-font-size, 0.875rem);
    font-weight: 500;
    color: var(--vsui-switch-label-color, #374151);
    cursor: pointer;

    &--top {
      margin-bottom: 0.5rem;
    }

    &--left {
      order: -1;
    }

    &--right {
      order: 1;
    }
  }

  &__required {
    color: var(--vsui-switch-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  // Label position variants
  &--label-top {
    .base-switch__wrapper-container {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  &--label-left,
  &--label-right {
    .base-switch__wrapper-container {
      flex-direction: row;
      align-items: center;
    }
  }

  &__helper {
    font-size: var(--vsui-switch-helper-font-size, 0.75rem);
    color: var(--vsui-switch-helper-color, #6b7280);

    &--error {
      color: var(--vsui-switch-error-color, #ef4444);
    }
  }

  &__spinner {
    width: 60%;
    height: 60%;
    border: 2px solid var(--vsui-switch-spinner-color, #3b82f6);
    border-bottom-color: transparent;
    border-radius: 50%;
    animation: switch-spin 0.8s linear infinite;
  }

  @keyframes switch-spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  // Sizes
  &--small {
    .base-switch__track {
      width: var(--vsui-switch-small-width, 40px);
      height: var(--vsui-switch-small-height, 20px);
    }

    .base-switch__thumb {
      width: var(--vsui-switch-small-thumb-size, 16px);
      height: var(--vsui-switch-small-thumb-size, 16px);
      left: 2px;
    }

    &.base-switch--on .base-switch__thumb {
      transform: translateX(20px);
    }
  }

  &--medium {
    .base-switch__track {
      width: var(--vsui-switch-medium-width, 48px);
      height: var(--vsui-switch-medium-height, 24px);
    }

    .base-switch__thumb {
      width: var(--vsui-switch-medium-thumb-size, 20px);
      height: var(--vsui-switch-medium-thumb-size, 20px);
      left: 2px;
    }

    &.base-switch--on .base-switch__thumb {
      transform: translateX(24px);
    }
  }

  &--large {
    .base-switch__track {
      width: var(--vsui-switch-large-width, 56px);
      height: var(--vsui-switch-large-height, 28px);
    }

    .base-switch__thumb {
      width: var(--vsui-switch-large-thumb-size, 24px);
      height: var(--vsui-switch-large-thumb-size, 24px);
      left: 2px;
    }

    &.base-switch--on .base-switch__thumb {
      transform: translateX(28px);
    }
  }

  // On state
  &--on {
    .base-switch__track {
      background-color: var(--vsui-switch-on-bg, #3b82f6);
    }
  }

  // Focus state
  &--focused {
    .base-switch__track {
      box-shadow: 0 0 0 3px var(--vsui-switch-focus-ring-color, rgba(59, 130, 246, 0.1));
    }
  }

  // States
  &--success {
    &.base-switch--on .base-switch__track {
      background-color: var(--vsui-switch-success-color, #22c55e);
    }

    &.base-switch--focused .base-switch__track {
      box-shadow: 0 0 0 3px var(--vsui-switch-success-ring-color, rgba(34, 197, 94, 0.1));
    }

    .base-switch__helper {
      color: var(--vsui-switch-success-color, #22c55e);
    }
  }

  &--error {
    &.base-switch--on .base-switch__track {
      background-color: var(--vsui-switch-error-color, #ef4444);
    }

    &.base-switch--focused .base-switch__track {
      box-shadow: 0 0 0 3px var(--vsui-switch-error-ring-color, rgba(239, 68, 68, 0.1));
    }

    .base-switch__helper {
      color: var(--vsui-switch-error-color, #ef4444);
    }
  }

  &--warning {
    &.base-switch--on .base-switch__track {
      background-color: var(--vsui-switch-warning-color, #f59e0b);
    }

    &.base-switch--focused .base-switch__track {
      box-shadow: 0 0 0 3px var(--vsui-switch-warning-ring-color, rgba(245, 158, 11, 0.1));
    }

    .base-switch__helper {
      color: var(--vsui-switch-warning-color, #f59e0b);
    }
  }

  // Variants
  &--filled {
    .base-switch__track {
      background-color: var(--vsui-switch-filled-bg, #f3f4f6);
    }

    &.base-switch--on .base-switch__track {
      background-color: var(--vsui-switch-on-bg, #3b82f6);
    }
  }

  // Disabled state
  &--disabled {
    opacity: var(--vsui-switch-disabled-opacity, 0.6);
    cursor: not-allowed;

    .base-switch__wrapper,
    .base-switch__label {
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  // Hover effects (only when not disabled)
  &:not(&--disabled) {
    .base-switch__wrapper:hover .base-switch__track {
      opacity: 0.9;
    }

    .base-switch__wrapper:hover .base-switch__thumb {
      box-shadow: var(--vsui-switch-thumb-hover-shadow, 0 4px 6px rgba(0, 0, 0, 0.15));
    }
  }
}
</style>
