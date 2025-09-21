<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAutoId } from '../composables/autoId'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'white', 'dark'].includes(value),
  },
  width: {
    type: String,
    default: 'auto',
  },
  closeOnClick: {
    type: Boolean,
    default: true,
  },
  closeOnClickOutside: {
    type: Boolean,
    default: true,
  },
})
const { autoId } = useAutoId('dropdown', props)

const emit = defineEmits(['update:modelValue'])

const dropdownRef = ref(null)
const menuRef = ref(null)
const isVisible = ref(props.modelValue)

const updatePosition = () => {
  if (!menuRef.value || !dropdownRef.value) return

  const menuRect = menuRef.value.getBoundingClientRect()
  const dropdownRect = dropdownRef.value.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  // Reset positions
  menuRef.value.style.top = '100%'
  menuRef.value.style.bottom = 'auto'
  menuRef.value.style.left = 'auto'
  menuRef.value.style.right = '0'

  // Check if menu is going off the right edge
  if (dropdownRect.right + menuRect.width > viewport.width) {
    menuRef.value.style.right = '0'
    menuRef.value.style.left = 'auto'
  }

  // Check if menu is going off the left edge
  if (dropdownRect.right - menuRect.width < 0) {
    menuRef.value.style.left = '0'
    menuRef.value.style.right = 'auto'
  }

  // Check if menu is going off the bottom
  if (dropdownRect.bottom + menuRect.height > viewport.height) {
    menuRef.value.style.bottom = '100%'
    menuRef.value.style.top = 'auto'
    menuRef.value.style.marginTop = '0'
    menuRef.value.style.marginBottom = '0.5rem'
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    isVisible.value = newValue
    if (newValue) {
      document.addEventListener('click', handleClickOutside)
      // Update position after render
      nextTick(() => {
        updatePosition()
      })
    } else {
      document.removeEventListener('click', handleClickOutside)
    }
  },
)

const handleClickOutside = (event) => {
  if (props.closeOnClickOutside && dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    emit('update:modelValue', false)
  }
}

const handleItemClick = (event) => {
  if (props.closeOnClick && !event.target.closest('[data-prevent-close]')) {
    emit('update:modelValue', false)
  }
}

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('click', handleClickOutside)
  }
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <div ref="dropdownRef" class="vsui base-dropdown" :id="autoId">
    <div class="base-dropdown__trigger" @click="emit('update:modelValue', !modelValue)">
      <slot name="trigger" />
    </div>

    <Transition name="dropdown">
      <div
        v-show="isVisible"
        ref="menuRef"
        class="base-dropdown__menu"
        :class="`base-dropdown__menu--${variant}`"
        :style="{ width }"
        @click="handleItemClick"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style lang="scss">
.base-dropdown {
  position: relative;
  display: inline-block;

  &__trigger {
    cursor: pointer;
  }

  &__menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    z-index: 50;
    border-radius: 0.375rem;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    min-width: 10rem;

    // Variants
    &--default {
      background-color: var(--vsui-dropdown-bg, #ffffff);
      border: 1px solid var(--vsui-dropdown-border-color, #e5e7eb);
    }

    &--white {
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
    }

    &--dark {
      background-color: var(--vsui-dropdown-dark-bg, #374151);
      border: 1px solid var(--vsui-dropdown-dark-border-color, #4b5563);
      color: white;
    }
  }
}

// Animations
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

// Optional dropdown item styles
.base-dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--vsui-dropdown-item-hover-bg, #f3f4f6);
  }

  .base-dropdown__menu--dark & {
    &:hover {
      background-color: var(--vsui-dropdown-dark-item-hover-bg, #4b5563);
    }
  }
}
</style>
