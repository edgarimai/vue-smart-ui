<script setup>
import { provide, ref } from 'vue'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'bordered', 'minimal'].includes(value),
  },
})

const activeItems = ref([])

const toggleItem = (id) => {
  if (props.multiple) {
    const index = activeItems.value.indexOf(id)
    if (index === -1) {
      activeItems.value.push(id)
    } else {
      activeItems.value.splice(index, 1)
    }
  } else {
    activeItems.value = activeItems.value.includes(id) ? [] : [id]
  }
}

provide('accordion', {
  activeItems,
  toggleItem,
  variant: props.variant,
})
</script>

<template>
  <div class="vsui base-accordion" :class="`base-accordion--${variant}`" :id="id">
    <slot />
  </div>
</template>

<style lang="scss">
.base-accordion {
  width: 100%;

  &--default {
    border: 1px solid var(--accordion-border-color, #e5e7eb);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  &--bordered {
    .base-accordion-item {
      border-bottom: 1px solid var(--accordion-border-color, #e5e7eb);

      &:last-child {
        border-bottom: none;
      }
    }
  }

  &--minimal {
    .base-accordion-item {
      margin-bottom: 0.5rem;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
