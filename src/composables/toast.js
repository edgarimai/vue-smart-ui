import { ref, createApp, h } from 'vue'
import ToastsContainer from '@/components/ToastsContainer.vue'
import { useToastConfig } from './toastConfig'

const toasts = ref([])
let toastId = 0
let toastContainer = null

export function useToast() {
  const { getToastDefaults } = useToastConfig()

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
    position,
    duration,
    closable,
    simple,
  }) => {
    createContainer()

    const defaults = getToastDefaults()
    const id = ++toastId

    toasts.value.push({
      id,
      message,
      title,
      variant,
      position: position ?? defaults.position,
      duration: duration ?? defaults.duration,
      closable: closable ?? defaults.closable,
      simple: simple ?? defaults.simple,
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
    default: (message, options = {}) => addToast({ ...options, message, variant: 'default' }),
    success: (message, options = {}) => addToast({ ...options, message, variant: 'success' }),
    error: (message, options = {}) => addToast({ ...options, message, variant: 'error' }),
    info: (message, options = {}) => addToast({ ...options, message, variant: 'info' }),
    warning: (message, options = {}) => addToast({ ...options, message, variant: 'warning' }),
  }
}
