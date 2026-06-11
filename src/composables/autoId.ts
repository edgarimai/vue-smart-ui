import { computed, type ComputedRef } from 'vue'

let counter = 0

interface AutoIdProps {
  id?: string
}

export function useAutoId(prefix = 'base', props: AutoIdProps): { autoId: ComputedRef<string> } {
  const generateId = (): string => {
    counter++
    return `${prefix}-${counter}`
  }

  const autoId = computed(() => props.id || generateId())

  return {
    autoId,
  }
}
