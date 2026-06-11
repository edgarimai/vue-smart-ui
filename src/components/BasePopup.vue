<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

export type PopupVariant = 'default' | 'info' | 'success' | 'warning' | 'error'
export type PopupSize = 'small' | 'medium' | 'large'
export type PopupPosition = 'center' | 'top' | 'bottom' | 'left' | 'right'

interface Props {
  modelValue?: boolean
  variant?: PopupVariant
  size?: PopupSize
  position?: PopupPosition
  disableClickOutside?: boolean
  closeOnEsc?: boolean
  scrollContentOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  variant: 'default',
  size: 'medium',
  position: 'center',
  disableClickOutside: false,
  closeOnEsc: true,
  scrollContentOnly: true,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean]; close: [] }>()

const popupRef = ref<HTMLElement | null>(null)

const handleClickOutside = (event: MouseEvent) => {
  if (
    !props.disableClickOutside &&
    popupRef.value &&
    !popupRef.value.contains(event.target as Node)
  ) {
    const clickedInAnyPopup = (event.target as HTMLElement).closest('.base-popup')
    if (!clickedInAnyPopup) {
      emit('update:modelValue', false)
      emit('close')
    }
  }
}

const handleEscKey = (event: KeyboardEvent) => {
  if (props.closeOnEsc && event.key === 'Escape') {
    emit('update:modelValue', false)
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  document.addEventListener('keydown', handleEscKey)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleEscKey)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="vsui base-popup-overlay"
      :class="[`base-popup-overlay--${position}`]"
    >
      <div
        ref="popupRef"
        class="base-popup"
        :class="[
          `base-popup--${variant}`,
          `base-popup--${size}`,
          `base-popup--${position}`,
          { 'base-popup--scroll-content-only': scrollContentOnly },
        ]"
      >
        <div class="base-popup__header" v-if="$slots.header">
          <slot name="header" />
        </div>

        <div class="base-popup__content">
          <slot />
        </div>

        <div class="base-popup__footer" v-if="$slots.footer">
          <slot name="footer" />
        </div>

        <button
          v-if="$slots.close"
          class="base-popup__close"
          @click="$emit('update:modelValue', false)"
        >
          <slot name="close" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
@mixin custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--vsui-border-strong);
    border-radius: 3px;

    &:hover {
      background: var(--vsui-border-strong);
    }
  }

  scrollbar-width: thin;
  scrollbar-color: var(--vsui-border-strong) transparent;
}

.base-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  z-index: 1000;

  &--center {
    align-items: center;
    justify-content: center;
  }
  &--top {
    align-items: flex-start;
    justify-content: center;
    padding-top: 2rem;
  }
  &--bottom {
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 2rem;
  }
  &--left {
    align-items: center;
    justify-content: flex-start;
    padding-left: 2rem;
  }
  &--right {
    align-items: center;
    justify-content: flex-end;
    padding-right: 2rem;
  }
}

.base-popup {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  @include custom-scrollbar;

  &--scroll-content-only {
    overflow-y: visible;

    .base-popup__content {
      flex: 1;
      overflow-y: auto;
      max-height: calc(90vh - 4rem);
      min-height: 0;

      @include custom-scrollbar;
    }
  }

  // Variants
  &--default {
    background-color: var(--vsui-popup-default-bg, white);
    border: 1px solid var(--vsui-popup-border-color, #e5e7eb);
  }

  &--info {
    background-color: var(--vsui-popup-info-bg, #eff6ff);
    border: 1px solid var(--vsui-popup-info-color, #3b82f6);

    .base-popup__header {
      background-color: var(--vsui-popup-info-color, #3b82f6);
      color: white;
    }
  }

  &--success {
    background-color: var(--vsui-popup-success-bg, #f0fdf4);
    border: 1px solid var(--vsui-popup-success-color, #22c55e);

    .base-popup__header {
      background-color: var(--vsui-popup-success-color, #22c55e);
      color: white;
    }
  }

  &--warning {
    background-color: var(--vsui-popup-warning-bg, #fffbeb);
    border: 1px solid var(--vsui-popup-warning-color, #f59e0b);

    .base-popup__header {
      background-color: var(--vsui-popup-warning-color, #f59e0b);
      color: white;
    }
  }

  &--error {
    background-color: var(--vsui-popup-error-bg, #fef2f2);
    border: 1px solid var(--vsui-popup-error-color, #ef4444);

    .base-popup__header {
      background-color: var(--vsui-popup-error-color, #ef4444);
      color: white;
    }
  }

  // Sizes
  &--small {
    width: 300px;
    .base-popup__content {
      padding: 1rem;
    }
  }

  &--medium {
    width: 500px;
    .base-popup__content {
      padding: 1.5rem;
    }
  }

  &--large {
    width: 800px;
    .base-popup__content {
      padding: 2rem;
    }
  }

  &__header {
    padding: 1rem;
    border-bottom: 1px solid var(--vsui-popup-border-color, #e5e7eb);
  }

  &__footer {
    padding: 1rem;
    border-top: 1px solid var(--vsui-popup-border-color, #e5e7eb);
  }

  &__close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;

    &:hover {
      opacity: 0.7;
    }
  }
}
</style>
