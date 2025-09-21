<script setup>
import { computed } from 'vue'
import { useAutoId } from '../composables/autoId'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  src: {
    type: String,
    default: null,
  },
  alt: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'filled', 'outlined'].includes(value),
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'xlarge'].includes(value),
  },
  shape: {
    type: String,
    default: 'circle',
    validator: (value) => ['circle', 'square', 'rounded'].includes(value),
  },
  status: {
    type: String,
    default: null,
    validator: (value) => ['online', 'offline', 'away', 'busy'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  fallback: {
    type: String,
    default: null,
  },
})

const { autoId } = useAutoId('avatar', props)

const emit = defineEmits(['error', 'load'])

// Computed properties
const hasImage = computed(() => !!props.src)

const initials = computed(() => {
  if (!props.name && !props.fallback) return '?'

  const text = props.name || props.fallback
  const parts = text.trim().split(' ')

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
})

const avatarClasses = computed(() => ({
  'vsui base-avatar': true,
  [`base-avatar--${props.variant}`]: true,
  [`base-avatar--${props.size}`]: true,
  [`base-avatar--${props.shape}`]: true,
  'base-avatar--disabled': props.disabled,
  'base-avatar--has-image': hasImage.value,
}))

const statusClasses = computed(() => ({
  'base-avatar__status': true,
  [`base-avatar__status--${props.status}`]: props.status,
}))

// Event handlers
const handleImageError = (event) => {
  emit('error', event)
}

const handleImageLoad = (event) => {
  emit('load', event)
}
</script>

<template>
  <div :id="autoId" :class="avatarClasses" :title="name || alt">
    <!-- Avatar image -->
    <img
      v-if="hasImage"
      :src="src"
      :alt="alt || name"
      class="base-avatar__image"
      @error="handleImageError"
      @load="handleImageLoad"
    />

    <!-- Avatar initials -->
    <div v-else class="base-avatar__initials">
      {{ initials }}
    </div>

    <!-- Status indicator -->
    <div v-if="status && !disabled" :class="statusClasses"></div>

    <!-- Custom content slot -->
    <slot />
  </div>
</template>

<style lang="scss">
.base-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--vsui-font-family-base, inherit);
  font-weight: 600;
  user-select: none;
  flex-shrink: 0;

  // Base sizes
  &--small {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }

  &--medium {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 0.875rem;
  }

  &--large {
    width: 3rem;
    height: 3rem;
    font-size: 1rem;
  }

  &--xlarge {
    width: 4rem;
    height: 4rem;
    font-size: 1.25rem;
  }

  // Shapes
  &--circle {
    border-radius: 50%;
  }

  &--square {
    border-radius: 0.25rem;
  }

  &--rounded {
    border-radius: 0.375rem;
  }

  // Variants
  &--default {
    background-color: var(--vsui-avatar-default-bg);
    color: var(--vsui-avatar-default-text);
    border: 2px solid var(--vsui-avatar-default-border);
  }

  &--filled {
    background-color: var(--vsui-avatar-filled-bg);
    color: var(--vsui-avatar-filled-text);
    border: 2px solid var(--vsui-avatar-filled-border);
  }

  &--outlined {
    background-color: var(--vsui-avatar-outlined-bg);
    color: var(--vsui-avatar-outlined-text);
    border: 2px solid var(--vsui-avatar-outlined-border);
  }

  // Image styles
  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }

  // Initials styles
  &__initials {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-weight: 600;
    text-transform: uppercase;
  }

  // Status indicator
  &__status {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 25%;
    height: 25%;
    border-radius: 50%;
    border: 2px solid var(--vsui-bg-default);

    &--online {
      background-color: var(--vsui-avatar-status-online);
    }

    &--offline {
      background-color: var(--vsui-avatar-status-offline);
    }

    &--away {
      background-color: var(--vsui-avatar-status-away);
    }

    &--busy {
      background-color: var(--vsui-avatar-status-busy);
    }
  }

  // Disabled state
  &--disabled {
    opacity: var(--vsui-avatar-disabled-opacity);
    cursor: not-allowed;

    .base-avatar__status {
      opacity: 0.6;
    }
  }

  // Dark mode adjustments
  .vsui[data-theme='dark'] &,
  .vsui.dark & {
    &--default {
      background-color: var(--vsui-bg-emphasized);
      color: var(--vsui-text-subtle);
      border-color: var(--vsui-border-default);
    }

    &--outlined {
      background-color: var(--vsui-bg-subtle);
      border-color: var(--vsui-border-strong);
    }

    .base-avatar__status {
      border-color: var(--vsui-bg-subtle);
    }
  }
}
</style>
