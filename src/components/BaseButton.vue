<script setup>
import { useAutoId } from '../composables/autoId'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value),
  },
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'gray', 'outline', 'ghost'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'auto'].includes(value),
  },
  block: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
})

const { autoId } = useAutoId('button', props)

defineEmits(['click'])
</script>

<template>
  <button
    :id="autoId"
    class="vsui base-button"
    :class="[
      `base-button--${variant}`,
      `base-button--${size}`,
      {
        'base-button--block': block,
        'base-button--disabled': disabled || loading,
        'base-button--icon-only': iconOnly,
      },
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <template v-if="$slots.prefix">
      <div v-if="loading" class="spinner"></div>
      <slot v-else name="prefix" />
    </template>

    <slot v-if="!iconOnly" />

    <template v-if="$slots.suffix">
      <div v-if="loading" class="spinner"></div>
      <slot v-else name="suffix" />
    </template>

    <div v-if="loading && !$slots.prefix && !$slots.suffix" class="spinner"></div>
  </button>
</template>

<style lang="scss">
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  // Variants
  &--primary {
    background-color: var(--button-primary-bg);
    color: var(--button-primary-text);

    &:hover:not(:disabled) {
      background-color: var(--button-primary-hover);
    }
  }

  &--secondary {
    background-color: var(--button-secondary-bg);
    color: var(--button-secondary-text);

    &:hover:not(:disabled) {
      background-color: var(--button-secondary-hover);
    }
  }

  &--gray {
    background-color: var(--button-gray-bg);
    color: var(--button-gray-text);

    &:hover:not(:disabled) {
      background-color: var(--button-gray-hover);
    }
  }

  &--outline {
    background-color: transparent;
    border: 1px solid var(--button-outline-border);
    color: var(--button-outline-text);

    &:hover:not(:disabled) {
      background-color: var(--button-outline-hover);
    }
  }

  &--ghost {
    background-color: transparent;
    color: var(--button-ghost-text);

    &:hover:not(:disabled) {
      opacity: 0.8;
    }
  }

  &--icon-only {
    aspect-ratio: 1/1;

    &.base-button--small {
      width: 2rem;
      height: 2rem;
      padding: 0;
    }

    &.base-button--medium {
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
    }

    &.base-button--large {
      width: 3rem;
      height: 3rem;
      padding: 0;
    }
  }

  // Sizes
  &--small {
    padding: 0.5rem 1rem;
    font-size: var(--button-small-font-size);
  }

  &--medium {
    padding: 0.75rem 1.5rem;
    font-size: var(--button-medium-font-size);
  }

  &--large {
    padding: 1rem 2rem;
    font-size: var(--button-large-font-size);
  }

  &--auto {
    padding: 0;
    margin: 0;
    width: auto;
  }

  // Modifiers
  &--block {
    width: 100%;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid var(--button-focus-outline);
    outline-offset: 2px;
  }

  // Spinner
  .spinner {
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  // Slot adjustments
  :deep([name='prefix']),
  :deep([name='suffix']) {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 1em;
      height: 1em;
    }
  }
}
</style>
