import { reactive } from 'vue'

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'

export interface ToastDefaults {
  position: ToastPosition
  duration: number
  closable: boolean
  simple: boolean
}

const defaultToastConfig: ToastDefaults = {
  position: 'top-right',
  duration: 3000,
  closable: true,
  simple: false,
}

const toastConfig = reactive<{ defaults: ToastDefaults }>({
  defaults: { ...defaultToastConfig },
})

export const useToastConfig = () => {
  const setToastDefaults = (config: Partial<ToastDefaults>): void => {
    toastConfig.defaults = { ...defaultToastConfig, ...config }
  }

  const getToastDefaults = (): ToastDefaults => {
    return { ...toastConfig.defaults }
  }

  const resetToastDefaults = (): void => {
    toastConfig.defaults = { ...defaultToastConfig }
  }

  return {
    setToastDefaults,
    getToastDefaults,
    resetToastDefaults,
    toastConfig,
  }
}
