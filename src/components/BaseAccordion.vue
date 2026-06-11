<script setup lang="ts">
import { provide, ref } from 'vue'
import { useAutoId } from '../composables/autoId'

export type AccordionVariant = 'default' | 'bordered' | 'minimal'

interface Props {
  id?: string
  multiple?: boolean
  variant?: AccordionVariant
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  multiple: false,
  variant: 'default',
})
const { autoId } = useAutoId('accordion', props)

const activeItems = ref<symbol[]>([])

const toggleItem = (id: symbol) => {
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
  <div class="vsui base-accordion" :class="`base-accordion--${variant}`" :id="autoId">
    <slot />
  </div>
</template>

<style lang="scss">
.base-accordion {
  width: 100%;

  &--default {
    border: 1px solid var(--vsui-accordion-border-color, #e5e7eb);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  &--bordered {
    .base-accordion-item {
      border-bottom: 1px solid var(--vsui-accordion-border-color, #e5e7eb);

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
