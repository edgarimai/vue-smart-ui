<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import SuccessIcon from './icons/IconSuccess.vue'
import ErrorIcon from './icons/IconError.vue'
import WarningIcon from './icons/IconWarning.vue'
import InfoIcon from './icons/IconInfo.vue'

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
  simple: {
    type: Boolean,
    default: false,
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

const icons = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
  default: InfoIcon,
}

const iconComponent = computed(() => icons[props.variant] || icons.default)

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)

  if (props.duration > 0) {
    if (props.simple) setTimeout(close, props.duration)
    else progressBarRef.value?.addEventListener('animationend', close, { once: true })
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
    class="vsui base-toast"
    :class="[
      `base-toast--${variant}`,
      `base-toast--${position}`,
      { 'base-toast--visible': isVisible },
      { 'base-toast--simple': simple },
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="base-toast__icon" v-if="!simple">
      <component :is="iconComponent" class="icon" />
    </div>

    <div class="base-toast__content">
      <div v-if="!simple && title" class="base-toast__title">{{ title }}</div>
      <div class="base-toast__message">
        {{ message }}
      </div>
    </div>

    <button v-if="closable" class="base-toast__close" @click="close">
      <span>&times;</span>
    </button>

    <div
      v-if="!simple && duration > 0"
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
  align-items: center;
  gap: 1.5rem;

  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 300px;
  max-width: 400px;
  transition: all 0.3s ease;
  overflow: hidden;

  // Variants
  &--default {
    background-color: var(--vsui-toast-default-bg, #fff);
    border: 1px solid var(--vsui-toast-default-color, #e5e7eb);
    color: var(--vsui-toast-default-text, #1f2937);
  }

  &--info {
    background-color: var(--vsui-toast-info-bg, #eff6ff);
    border: 1px solid var(--vsui-toast-info-color, #3b82f6);
    color: var(--vsui-toast-info-text, #1e40af);
  }

  &--success {
    background-color: var(--vsui-toast-success-bg, #f0fdf4);
    border: 1px solid var(--vsui-toast-success-color, #22c55e);
    color: var(--vsui-toast-success-text, #15803d);
  }

  &--warning {
    background-color: var(--vsui-toast-warning-bg, #fffbeb);
    border: 1px solid var(--vsui-toast-warning-color, #f59e0b);
    color: var(--vsui-toast-warning-text, #b45309);
  }

  &--error {
    background-color: var(--vsui-toast-error-bg, #fef2f2);
    border: 1px solid var(--vsui-toast-error-color, #ef4444);
    color: var(--vsui-toast-error-text, #b91c1c);
  }

  &__icon {
    display: flex;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
  }

  &__title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    font-size: var(--vsui-toast-title-font-size);
  }

  &__message {
    font-size: var(--vsui-toast-message-font-size);
  }

  &__close {
    background: none;
    border: none;
    padding: 0.25rem;
    margin: -0.25rem;
    cursor: pointer;
    color: currentColor;
    opacity: 0.6;
    font-size: 1.5rem;

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
      background-color: var(--vsui-toast-default-color, #9ca3af);
    }

    &--info {
      background-color: var(--vsui-toast-info-color, #3b82f6);
    }

    &--success {
      background-color: var(--vsui-toast-success-color, #22c55e);
    }

    &--warning {
      background-color: var(--vsui-toast-warning-color, #f59e0b);
    }

    &--error {
      background-color: var(--vsui-toast-error-color, #ef4444);
    }
  }

  &--simple {
    padding: 0.75rem 1rem;
    min-width: 200px;

    .base-toast__message {
      margin: 0;
    }

    .base-toast__close {
      margin-left: 0.5rem;
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
