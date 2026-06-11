<script setup lang="ts">
export type SkeletonVariant = 'rectangle' | 'circle' | 'text' | 'heading' | 'button'

interface Props {
  variant?: SkeletonVariant
  width?: string
  height?: string | null
  animated?: boolean
  rounded?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'rectangle',
  width: '100%',
  height: null,
  animated: true,
  rounded: false,
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
      height: height || undefined,
    }"
  >
    <slot />
  </div>
</template>

<style lang="scss">
.base-skeleton {
  display: block;
  background-color: var(--vsui-skeleton-bg, #e5e7eb);
  position: relative;
  overflow: hidden;

  // Variants
  &--rectangle {
    height: var(--vsui-skeleton-rectangle-height, 1.5rem);
  }

  &--circle {
    border-radius: 50%;
    height: var(--vsui-skeleton-circle-size, 3rem);
    width: var(--vsui-skeleton-circle-size, 3rem);
  }

  &--text {
    height: var(--vsui-skeleton-text-height, 1rem);
    margin: 0.5rem 0;

    &:last-child {
      width: 80%; // Last line shorter
    }
  }

  &--heading {
    height: var(--vsui-skeleton-heading-height, 2rem);
    margin: 1rem 0;
  }

  &--button {
    height: var(--vsui-skeleton-button-height, 2.5rem);
    width: var(--vsui-skeleton-button-width, 8rem);
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
        var(--vsui-skeleton-shine, rgba(255, 255, 255, 0.3)),
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
