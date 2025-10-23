import { reactive } from 'vue'

const defaultMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email',
  min: (min) => `Must be at least ${min} characters`,
  max: (max) => `Must be no more than ${max} characters`,
  pattern: 'Invalid format',
  minValue: (min) => `Value must be at least ${min}`,
  maxValue: (max) => `Value must be no more than ${max}`,
  hexColor: 'Invalid HEX color',
  rgbColor: 'Invalid RGB color',
  rgbaColor: 'Invalid RGBA color',
  hslColor: 'Invalid HSL color',
}

const validationConfig = reactive({
  messages: { ...defaultMessages },
})

export const useValidationConfig = () => {
  const setValidationMessages = (messages) => {
    validationConfig.messages = { ...defaultMessages, ...messages }
  }

  const getValidationMessage = (key, param) => {
    const message = validationConfig.messages[key]
    if (typeof message === 'function') return message(param)
    return message || defaultMessages[key]
  }

  const resetValidationMessages = () => {
    validationConfig.messages = { ...defaultMessages }
  }

  return {
    setValidationMessages,
    getValidationMessage,
    resetValidationMessages,
    validationConfig,
  }
}

