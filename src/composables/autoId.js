import { computed } from 'vue'

let counter = 0

export function useAutoId(prefix = 'base', props) {
  const generateId = () => {
    counter++
    return `${prefix}-${counter}`
  }

  const autoId = computed(() => props.id || generateId())

  return {
    autoId,
  }
}
