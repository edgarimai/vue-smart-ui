<script setup>
import { useAutoId } from '../composables/autoId'

defineOptions({
  inheritAttrs: false,
})

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
    validator: (value) =>
      ['primary', 'secondary', 'gray', 'white', 'outline', 'ghost'].includes(value),
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
        'base-button--loading': loading,
      },
      $attrs.class,
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <div class="button-content" :class="[{ hidden: loading }]">
      <template v-if="$slots.prefix">
        <slot name="prefix" />
      </template>

      <slot />

      <template v-if="$slots.suffix">
        <slot name="suffix" />
      </template>
    </div>

    <div v-if="loading" class="spinner"></div>
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
    background-color: var(--vsui-button-primary-bg);
    color: var(--vsui-button-primary-text);

    &:hover:not(:disabled) {
      background-color: var(--vsui-button-primary-hover);
    }
  }

  &--secondary {
    background-color: var(--vsui-button-secondary-bg);
    color: var(--vsui-button-secondary-text);

    &:hover:not(:disabled) {
      background-color: var(--vsui-button-secondary-hover);
    }
  }

  &--gray {
    background-color: var(--vsui-button-gray-bg);
    color: var(--vsui-button-gray-text);

    &:hover:not(:disabled) {
      background-color: var(--vsui-button-gray-hover);
    }
  }

  &--white {
    background-color: var(--vsui-button-white-bg);
    color: var(--vsui-button-white-text);

    &:hover:not(:disabled) {
      background-color: var(--vsui-button-white-hover);
    }
  }

  &--outline {
    background-color: transparent;
    border: 1px solid var(--vsui-button-outline-border);
    color: var(--vsui-button-outline-text);

    &:hover:not(:disabled) {
      background-color: var(--vsui-button-outline-hover);
    }
  }

  &--outline-red {
    background-color: transparent;
    border: 1px solid var(--vsui-color-error);
    color: var(--vsui-color-error);

    &:hover:not(:disabled) {
      background-color: var(--vsui-button-outline-hover);
    }
  }

  &--ghost {
    background-color: transparent;
    color: var(--vsui-button-ghost-text);

    &:hover:not(:disabled) {
      opacity: 0.8;
    }

    &:focus {
      outline: none;
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
    font-size: var(--vsui-button-small-font-size);
  }

  &--medium {
    padding: 0.75rem 1.5rem;
    font-size: var(--vsui-button-medium-font-size);
  }

  &--large {
    padding: 1rem 2rem;
    font-size: var(--vsui-button-large-font-size);
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
    outline: 2px solid var(--vsui-button-focus-outline);
    outline-offset: 2px;
  }

  &--loading {
    position: relative;
  }

  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    &.hidden {
      visibility: hidden;
    }
  }

  // Spinner
  .spinner {
    width: 1em;
    height: 1em;
    border: 3px solid currentColor;
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    animation: rotation 1s linear infinite;
    position: absolute;
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
