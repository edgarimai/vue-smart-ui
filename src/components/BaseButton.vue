<script setup lang="ts">
import { useAutoId } from '../composables/autoId'

export type ButtonType = 'button' | 'submit' | 'reset'
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'gray'
  | 'white'
  | 'outline'
  | 'outline-red'
  | 'ghost'
export type ButtonSize = 'small' | 'medium' | 'large' | 'auto'

interface Props {
  id?: string
  type?: ButtonType
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  disabled?: boolean
  loading?: boolean
  iconOnly?: boolean
  hideFocusOutline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  type: 'button',
  variant: 'primary',
  size: 'medium',
  block: false,
  disabled: false,
  loading: false,
  iconOnly: false,
  hideFocusOutline: false,
})

const { autoId } = useAutoId('button', props)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  // `loading` only blocked the pointer (CSS), so Enter/Space and a submit button still fired.
  if (props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
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
        'base-button--disabled': disabled,
        'base-button--icon-only': iconOnly,
        'base-button--loading': loading,
        'base-button--hide-focus-outline': hideFocusOutline,
      },
    ]"
    :disabled="disabled"
    :aria-busy="loading || undefined"
    @click="handleClick"
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
  border: 1px solid transparent;
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
    border-color: var(--vsui-button-outline-border);
    color: var(--vsui-button-outline-text);

    &:hover:not(:disabled) {
      background-color: var(--vsui-button-outline-hover);
    }
  }

  &--outline-red {
    background-color: transparent;
    border-color: var(--vsui-color-error);
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

    &:focus {
      outline: none;
    }

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
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus {
    outline: 1px solid var(--vsui-button-focus-outline);
    outline-offset: 1px;
  }

  &--hide-focus-outline:focus {
    outline: none;
  }

  &--loading {
    position: relative;
    pointer-events: none;
  }

  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;

    &.hidden {
      // visibility: hidden;
      opacity: 0.6;
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
    animation: vsui-rotation 1s linear infinite;
    position: absolute;
    // Same colour as before the combobox spinner rule was scoped (it used to leak into this one).
    color: var(--vsui-input-placeholder-color, #9ca3af);
  }

  @keyframes vsui-rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
