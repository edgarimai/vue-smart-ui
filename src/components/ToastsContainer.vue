<script setup>
import { useToast } from '@/composables/toast'
import { computed } from 'vue'
import { BaseToast } from '@/components'

const { toasts, removeToast } = useToast()

const groupedToasts = computed(() => {
  const groups = {
    'top-right': [],
    'top-left': [],
    'top-center': [],
    'bottom-right': [],
    'bottom-left': [],
    'bottom-center': [],
  }

  toasts.value.forEach((toast) => {
    groups[toast.position].push(toast)
  })

  return groups
})
</script>

<template>
  <template v-for="(group, position) in groupedToasts" :key="position">
    <div v-if="group.length" class="vsui toasts-container" :class="`toasts-container--${position}`">
      <TransitionGroup name="toast">
        <BaseToast
          v-for="toast in group"
          :key="toast.id"
          v-bind="toast"
          @close="removeToast(toast.id)"
        />
      </TransitionGroup>
    </div>
  </template>
</template>

<style lang="scss">
.toasts-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  // Upper positions
  &--top-right {
    top: 0;
    right: 0;
  }

  &--top-left {
    top: 0;
    left: 0;
  }

  &--top-center {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
  }

  // Lower positions (reverse order)
  &--bottom-right {
    bottom: 0;
    right: 0;
    flex-direction: column-reverse;
  }

  &--bottom-left {
    bottom: 0;
    left: 0;
    flex-direction: column-reverse;
  }

  &--bottom-center {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
    flex-direction: column-reverse;
  }
}

// Animations
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

// For upper toasts
.toasts-container--top-right,
.toasts-container--top-left {
  .toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
  }
  .toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }
}

// For lower toasts
.toasts-container--bottom-right,
.toasts-container--bottom-left {
  .toast-enter-from {
    opacity: 0;
    transform: translateX(100%);
  }
  .toast-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }
}

// For center toasts
.toasts-container--top-center,
.toasts-container--bottom-center {
  .toast-enter-from {
    opacity: 0;
    transform: translateY(-100%);
  }
  .toast-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
}
</style>
