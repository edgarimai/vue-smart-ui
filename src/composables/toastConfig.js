import { reactive } from 'vue'

const defaultToastConfig = {
  position: 'top-right',
  duration: 3000,
  closable: true,
  simple: false,
}

const toastConfig = reactive({
  defaults: { ...defaultToastConfig },
})

export const useToastConfig = () => {
  const setToastDefaults = (config) => {
    toastConfig.defaults = { ...defaultToastConfig, ...config }
  }

  const getToastDefaults = () => {
    return { ...toastConfig.defaults }
  }

  const resetToastDefaults = () => {
    toastConfig.defaults = { ...defaultToastConfig }
  }

  return {
    setToastDefaults,
    getToastDefaults,
    resetToastDefaults,
    toastConfig,
  }
}

