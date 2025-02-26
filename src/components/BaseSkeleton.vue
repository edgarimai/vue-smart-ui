<script setup>
defineProps({
  variant: {
    type: String,
    default: 'rectangle',
    validator: (value) => ['rectangle', 'circle', 'text', 'heading', 'button'].includes(value),
  },
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: null,
  },
  animated: {
    type: Boolean,
    default: true,
  },
  rounded: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="vsui base-skeleton"
    :class="[
      `base-skeleton--${variant}`,
      {
        'base-skeleton--animated': animated,
        'base-skeleton--rounded': rounded,
      },
    ]"
    :style="{
      width,
      height: height || null,
    }"
  >
    <slot />
  </div>
</template>

<style lang="scss">
.base-skeleton {
  display: block;
  background-color: var(--skeleton-bg, #e5e7eb);
  position: relative;
  overflow: hidden;

  // Variants
  &--rectangle {
    height: var(--skeleton-rectangle-height, 1.5rem);
  }

  &--circle {
    border-radius: 50%;
    height: var(--skeleton-circle-size, 3rem);
    width: var(--skeleton-circle-size, 3rem);
  }

  &--text {
    height: var(--skeleton-text-height, 1rem);
    margin: 0.5rem 0;

    &:last-child {
      width: 80%; // Last line shorter
    }
  }

  &--heading {
    height: var(--skeleton-heading-height, 2rem);
    margin: 1rem 0;
  }

  &--button {
    height: var(--skeleton-button-height, 2.5rem);
    width: var(--skeleton-button-width, 8rem);
  }

  &--rounded {
    border-radius: 0.375rem;
  }

  // Animation
  &--animated {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent,
        var(--skeleton-shine, rgba(255, 255, 255, 0.3)),
        transparent
      );
      animation: skeleton-shine 1.5s infinite;
    }
  }
}

@keyframes skeleton-shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
