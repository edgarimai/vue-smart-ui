<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  loading?: boolean
  disabled?: boolean
  threshold?: number
  container?: string | null
  loadingText?: string
  endText?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  threshold: 20, // pixels before the end to trigger
  container: null, // If null, uses window
  loadingText: 'Loading more items...',
  endText: 'There are no more items to load',
})

const emit = defineEmits<{ 'load-more': [] }>()

const observer = ref<IntersectionObserver | null>(null)
const bottomElement = ref<HTMLDivElement | null>(null)

const createObserver = () => {
  if (observer.value) {
    observer.value.disconnect()
  }

  observer.value = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      const first = entries[0]
      if (first.isIntersecting && !props.loading && !props.disabled) {
        emit('load-more')
      }
    },
    {
      threshold: 0,
      root: props.container ? document.querySelector(props.container) : null,
      rootMargin: `0px 0px ${props.threshold}px 0px`,
    },
  )

  if (bottomElement.value) {
    observer.value.observe(bottomElement.value)
  }
}

// Watch for changes in loading to reobserve after loading
watch(
  () => props.loading,
  (newValue, oldValue) => {
    if (oldValue === true && newValue === false) {
      // Small delay to ensure the DOM was updated
      setTimeout(() => {
        createObserver()
      }, 100)
    }
  },
)

onMounted(() => {
  createObserver()
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<template>
  <div class="vsui infinite-scroll">
    <slot />

    <div ref="bottomElement" class="infinite-scroll__trigger">
      <slot name="loading" v-if="loading">
        <div class="infinite-scroll__loader">
          <div class="spinner"></div>
          <span v-if="loadingText">{{ loadingText }}</span>
        </div>
      </slot>

      <slot name="disabled" v-else-if="disabled">
        <div class="infinite-scroll__end" v-if="endText">{{ endText }}</div>
      </slot>
    </div>
  </div>
</template>

<style lang="scss">
.infinite-scroll {
  &__loader {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    gap: 0.5rem;
    color: #6b7280;

    // Spinner
    .spinner {
      width: 1em;
      height: 1em;
      border: 2px solid currentColor;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: rotation 1s linear infinite;
    }
  }

  &__end {
    text-align: center;
    padding: 2rem 1rem;
    color: #6b7280;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
