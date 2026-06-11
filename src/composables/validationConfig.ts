import { reactive } from 'vue'

export type ValidationMessage = string | ((param?: string | number) => string)

export interface ValidationMessages {
  required: ValidationMessage
  email: ValidationMessage
  min: ValidationMessage
  max: ValidationMessage
  pattern: ValidationMessage
  minValue: ValidationMessage
  maxValue: ValidationMessage
  hexColor: ValidationMessage
  rgbColor: ValidationMessage
  rgbaColor: ValidationMessage
  hslColor: ValidationMessage
  [key: string]: ValidationMessage
}

const defaultMessages: ValidationMessages = {
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

const validationConfig = reactive<{ messages: ValidationMessages }>({
  messages: { ...defaultMessages },
})

export const useValidationConfig = () => {
  const setValidationMessages = (messages: Partial<ValidationMessages>): void => {
    validationConfig.messages = { ...defaultMessages, ...messages } as ValidationMessages
  }

  const getValidationMessage = (key: string, param?: string | number): string => {
    const message = validationConfig.messages[key]
    if (typeof message === 'function') return message(param)
    return message || (defaultMessages[key] as string)
  }

  const resetValidationMessages = (): void => {
    validationConfig.messages = { ...defaultMessages } as ValidationMessages
  }

  return {
    setValidationMessages,
    getValidationMessage,
    resetValidationMessages,
    validationConfig,
  }
}
