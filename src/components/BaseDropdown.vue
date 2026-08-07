<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAutoId } from '../composables/autoId'
import { useFloatingMenu } from '../composables/floatingMenu'

export type DropdownVariant = 'default' | 'white' | 'dark'

interface Props {
  id?: string
  modelValue?: boolean
  variant?: DropdownVariant
  width?: string
  closeOnClick?: boolean
  closeOnClickOutside?: boolean
  teleport?: boolean
  teleportTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  modelValue: false,
  variant: 'default',
  width: 'auto',
  closeOnClick: true,
  closeOnClickOutside: true,
  teleport: true,
  teleportTo: 'body',
})
const { autoId } = useAutoId('dropdown', props)

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const dropdownRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const isVisible = ref(props.modelValue)

const { floatingStyle, updatePosition, startTracking, stopTracking } = useFloatingMenu({
  anchorRef: dropdownRef,
  menuRef,
  align: 'end',
  offset: 8,
  enabled: () => props.teleport,
})

watch(
  () => props.modelValue,
  (newValue: boolean) => {
    isVisible.value = newValue
    if (newValue) {
      document.addEventListener('click', handleClickOutside)
      startTracking()
      // Update position after render
      nextTick(() => {
        updatePosition()
      })
    } else {
      document.removeEventListener('click', handleClickOutside)
      stopTracking()
    }
  },
)

const handleClickOutside = (event: MouseEvent) => {
  if (
    props.closeOnClickOutside &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node) &&
    menuRef.value &&
    !menuRef.value.contains(event.target as Node)
  ) {
    emit('update:modelValue', false)
  }
}

const handleItemClick = (event: MouseEvent) => {
  if (props.closeOnClick && !(event.target as HTMLElement).closest('[data-prevent-close]')) {
    emit('update:modelValue', false)
  }
}

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('click', handleClickOutside)
    startTracking()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  stopTracking()
})
</script>

<template>
  <div ref="dropdownRef" class="vsui base-dropdown" :id="autoId">
    <div class="base-dropdown__trigger" @click="emit('update:modelValue', !modelValue)">
      <slot name="trigger" />
    </div>

    <Teleport :to="teleportTo" :disabled="!teleport">
      <Transition name="dropdown">
        <div
          v-show="isVisible"
          ref="menuRef"
          class="base-dropdown__menu"
          :class="[
            `base-dropdown__menu--${variant}`,
            { vsui: teleport, 'base-dropdown__menu--floating': teleport },
          ]"
          :data-vsui-floating="teleport ? '' : null"
          :style="[{ width }, floatingStyle]"
          @click="handleItemClick"
        >
          <slot />
        </div>
      </Transition>
    </Teleport>
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

    &--floating {
      position: fixed;
      top: auto;
      left: auto;
      right: auto;
      margin-top: 0;
      z-index: var(--vsui-floating-z-index, 1100);
    }

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
