<script setup>
import { inject, ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const accordion = inject('accordion')
const id = ref(Symbol())
const contentHeight = ref('0px')
const contentRef = ref(null)

const isActive = computed(() => accordion.activeItems.value.includes(id.value))
const variant = computed(() => accordion.variant)

const toggle = () => {
  if (!props.disabled) {
    accordion.toggleItem(id.value)
  }
}

const updateHeight = () => {
  if (contentRef.value) {
    contentHeight.value = isActive.value ? `${contentRef.value.scrollHeight}px` : '0px'
  }
}

// Update height when the content changes
const observer = new ResizeObserver(updateHeight)

onMounted(() => {
  if (contentRef.value) {
    observer.observe(contentRef.value)
    updateHeight()
  }
})

onUnmounted(() => {
  observer.disconnect()
})

// Update height when the active state changes
watch(isActive, updateHeight)
</script>

<template>
  <div
    class="vsui base-accordion-item"
    :class="[
      `base-accordion-item--${variant}`,
      {
        'base-accordion-item--active': isActive,
        'base-accordion-item--disabled': disabled,
      },
    ]"
  >
    <button
      class="base-accordion-item__header"
      @click="toggle"
      :disabled="disabled"
      :aria-expanded="isActive"
    >
      <slot name="icon" v-if="$slots.icon"> </slot>

      <slot name="title">
        {{ title }}
      </slot>

      <slot name="chevron">
        <svg class="base-accordion-item__chevron" viewBox="0 0 24 24" width="1.2em" height="1.2em">
          <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </slot>
    </button>

    <div class="base-accordion-item__content" ref="contentRef" :style="{ height: contentHeight }">
      <div class="base-accordion-item__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.base-accordion-item {
  &__header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 1rem;
    font-weight: 500;
    color: var(--vsui-accordion-header-color, #111827);

    &:hover {
      background-color: var(--vsui-accordion-hover-bg, #f9fafb);
    }

    &:focus {
      outline: 2px solid var(--vsui-accordion-focus-ring, #3b82f6);
      outline-offset: -2px;
    }
  }

  &__chevron {
    margin-left: auto;
    transition: transform 0.2s;
  }

  &__content {
    overflow: hidden;
    transition: height 0.2s ease-in-out;
  }

  &__body {
    padding: 0 1rem 1rem;
  }

  // Active state
  &--active {
    .base-accordion-item__chevron {
      transform: rotate(180deg);
    }
  }

  // Disabled state
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;

    .base-accordion-item__header {
      cursor: not-allowed;
    }
  }
}
</style>
