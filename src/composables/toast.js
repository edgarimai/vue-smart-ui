import { ref, createApp, h } from 'vue'
import ToastsContainer from '@/components/ToastsContainer.vue'

const toasts = ref([])
let toastId = 0
let toastContainer = null

export function useToast() {
  const createContainer = () => {
    if (toastContainer) return

    const containerDiv = document.createElement('div')
    containerDiv.id = 'toast-container'
    document.body.appendChild(containerDiv)

    toastContainer = createApp({
      render: () => h(ToastsContainer),
    }).mount(containerDiv)
  }

  const addToast = ({
    message,
    title = '',
    variant = 'default',
    position = 'top-right',
    duration = 3000,
    closable = true,
    simple = false,
  }) => {
    createContainer()

    const id = ++toastId

    toasts.value.push({
      id,
      message,
      title,
      variant,
      position,
      duration,
      closable,
      simple,
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
