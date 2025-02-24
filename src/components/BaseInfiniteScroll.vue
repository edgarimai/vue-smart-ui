<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  threshold: {
    type: Number,
    default: 20, // pixels before the end to trigger
  },
  container: {
    type: String,
    default: null, // If null, uses window
  },
})

const emit = defineEmits(['load-more'])

const observer = ref(null)
const bottomElement = ref(null)

const createObserver = () => {
  if (observer.value) {
    observer.value.disconnect()
  }

  observer.value = new IntersectionObserver(
    (entries) => {
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
  <div class="infinite-scroll">
    <!-- Main content -->
    <slot />

    <!-- Observed element to trigger -->
    <div ref="bottomElement" class="infinite-scroll__trigger">
      <!-- Loading slot -->
      <slot name="loading" v-if="loading">
        <div class="infinite-scroll__loader">
          <div class="spinner"></div>
          <span>Loading more items...</span>
        </div>
      </slot>

      <!-- No more items slot -->
      <slot name="disabled" v-else-if="disabled">
        <div class="infinite-scroll__end">There are no more items to load</div>
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
    padding: 1rem;
    gap: 0.5rem;
    color: #6b7280;
  }

  &__end {
    text-align: center;
    padding: 1rem;
    color: #6b7280;
  }

  .spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
