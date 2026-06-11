import { ref, createApp, h, type Ref } from 'vue'
import ToastsContainer from '@/components/ToastsContainer.vue'
import { useToastConfig, type ToastPosition } from './toastConfig'

export type ToastVariant = 'default' | 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  message: string
  title: string
  variant: ToastVariant
  position: ToastPosition
  duration: number
  closable: boolean
  simple: boolean
}

export interface ToastOptions {
  title?: string
  variant?: ToastVariant
  position?: ToastPosition
  duration?: number
  closable?: boolean
  simple?: boolean
}

interface AddToastArgs extends ToastOptions {
  message: string
}

const toasts: Ref<Toast[]> = ref([])
let toastId = 0
let toastContainer: ReturnType<ReturnType<typeof createApp>['mount']> | null = null

export function useToast() {
  const { getToastDefaults } = useToastConfig()

  const createContainer = (): void => {
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
  }: AddToastArgs): number => {
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

  const removeToast = (id: number): void => {
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
    default: (message: string, options: ToastOptions = {}) =>
      addToast({ ...options, message, variant: 'default' }),
    success: (message: string, options: ToastOptions = {}) =>
      addToast({ ...options, message, variant: 'success' }),
    error: (message: string, options: ToastOptions = {}) =>
      addToast({ ...options, message, variant: 'error' }),
    info: (message: string, options: ToastOptions = {}) =>
      addToast({ ...options, message, variant: 'info' }),
    warning: (message: string, options: ToastOptions = {}) =>
      addToast({ ...options, message, variant: 'warning' }),
  }
}
