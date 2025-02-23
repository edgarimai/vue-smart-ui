import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

export function useToast() {
  const addToast = ({
    message,
    title = '',
    variant = 'default',
    position = 'top-right',
    duration = 3000,
    closable = true,
  }) => {
    const id = ++toastId

    toasts.value.push({
      id,
      message,
      title,
      variant,
      position,
      duration,
      closable,
    })

    return id
  }

  const removeToast = (id) => {
    const index = toasts.value.findIndex((toast) => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  return {
    toasts,
    addToast,
    removeToast,
    // Convenience methods
    success: (message, options = {}) => addToast({ ...options, message, variant: 'success' }),
    error: (message, options = {}) => addToast({ ...options, message, variant: 'error' }),
    info: (message, options = {}) => addToast({ ...options, message, variant: 'info' }),
    warning: (message, options = {}) => addToast({ ...options, message, variant: 'warning' }),
  }
}
