<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'info', 'success', 'warning', 'error'].includes(value),
  },
  position: {
    type: String,
    default: 'top-right',
    validator: (value) =>
      [
        'top-right',
        'top-left',
        'top-center',
        'bottom-right',
        'bottom-left',
        'bottom-center',
      ].includes(value),
  },
  duration: {
    type: Number,
    default: 3000,
  },
  closable: {
    type: Boolean,
    default: true,
  },
  message: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

const isVisible = ref(false)

const progressBarRef = ref(null)
const progressWidth = ref('100%')
const startProgress = () => {
  if (props.duration > 0) {
    progressWidth.value = '100%'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progressWidth.value = '0%'
      })
    })
  }
}

const close = () => {
  isVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 100) // Time for exit animation
}

const handleMouseEnter = () => {
  if (progressBarRef.value) {
    progressBarRef.value.style.animationPlayState = 'paused'
  }
}

const handleMouseLeave = () => {
  if (progressBarRef.value) {
    progressBarRef.value.style.animationPlayState = 'running'
  }
}

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)

  if (props.duration > 0) {
    progressBarRef.value?.addEventListener('animationend', close, { once: true })
  }

  startProgress()
})

onUnmounted(() => {
  if (progressBarRef.value) {
    progressBarRef.value.removeEventListener('animationend', close)
  }
})
</script>

<template>
  <div
    :data-toast-id="id"
    class="base-toast"
    :class="[
      `base-toast--${variant}`,
      `base-toast--${position}`,
      { 'base-toast--visible': isVisible },
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="base-toast__icon" v-if="$slots.icon">
      <slot name="icon" />
    </div>
    <div v-else class="base-toast__icon">
      <span :class="`icon-${variant}`" />
    </div>

    <div class="base-toast__content">
      <div v-if="title" class="base-toast__title">{{ title }}</div>
      <div class="base-toast__message">
        <slot>{{ message }}</slot>
      </div>
    </div>

    <button v-if="closable" class="base-toast__close" @click="close">
      <slot name="close-icon">
        <span>&times;</span>
      </slot>
    </button>

    <div
      v-if="duration > 0"
      ref="progressBarRef"
      class="progress-bar"
      :class="`progress-bar--${variant}`"
      :style="{
        animationDuration: `${duration}ms`,
      }"
    ></div>
  </div>
</template>

<style lang="scss">
.base-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 400px;
  transition: all 0.3s ease;
  overflow: hidden;

  // Variants
  &--default {
    background-color: var(--toast-default-bg, #fff);
    border: 1px solid var(--toast-border-color, #e5e7eb);
    color: var(--toast-text-color, #1f2937);
  }

  &--info {
    background-color: var(--toast-info-bg, #eff6ff);
    border: 1px solid var(--toast-info-color, #3b82f6);
    color: var(--toast-info-text, #1e40af);
  }

  &--success {
    background-color: var(--toast-success-bg, #f0fdf4);
    border: 1px solid var(--toast-success-color, #22c55e);
    color: var(--toast-success-text, #15803d);
  }

  &--warning {
    background-color: var(--toast-warning-bg, #fffbeb);
    border: 1px solid var(--toast-warning-color, #f59e0b);
    color: var(--toast-warning-text, #b45309);
  }

  &--error {
    background-color: var(--toast-error-bg, #fef2f2);
    border: 1px solid var(--toast-error-color, #ef4444);
    color: var(--toast-error-text, #b91c1c);
  }

  &__icon {
    flex-shrink: 0;
    margin-right: 0.75rem;
    width: 1.5rem;
    height: 1.5rem;
  }

  &__content {
    flex: 1;
  }

  &__title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    font-size: var(--toast-title-font-size);
  }

  &__message {
    font-size: var(--toast-message-font-size);
  }

  &__close {
    background: none;
    border: none;
    padding: 0.25rem;
    margin: -0.25rem;
    cursor: pointer;
    color: currentColor;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }
  }

  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    transform-origin: left;
    animation: progress linear forwards;

    &--default {
      background-color: var(--toast-default-bg, #9ca3af);
    }

    &--info {
      background-color: var(--toast-info-color, #3b82f6);
    }

    &--success {
      background-color: var(--toast-success-color, #22c55e);
    }

    &--warning {
      background-color: var(--toast-warning-color, #f59e0b);
    }

    &--error {
      background-color: var(--toast-error-color, #ef4444);
    }
  }
}

@keyframes progress {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
</style>
