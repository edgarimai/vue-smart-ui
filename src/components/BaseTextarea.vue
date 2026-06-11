<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAutoId } from '../composables/autoId'

export type TextareaVariant = 'default' | 'filled' | 'outlined'
export type TextareaState = 'success' | 'error' | 'warning'
export type TextareaResize = 'none' | 'both' | 'horizontal' | 'vertical'

export interface TextareaRuleObject {
  message?: string
  validator?: (value: string) => boolean
  required?: boolean
  [key: string]: unknown
}
export type TextareaRule = string | TextareaRuleObject

interface Props {
  id?: string
  modelValue?: string
  transparentBg?: boolean
  variant?: TextareaVariant
  state?: TextareaState | null
  label?: string | null
  placeholder?: string
  rows?: string | number
  maxRows?: string | number | null
  disabled?: boolean
  block?: boolean
  readonly?: boolean
  required?: boolean
  helperText?: string | null
  errorMessage?: string | null
  rules?: TextareaRule[]
  validateOnBlur?: boolean
  validateOnInput?: boolean
  name?: string
  resize?: TextareaResize
  autoResize?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  modelValue: '',
  transparentBg: false,
  variant: 'default',
  state: null,
  label: null,
  placeholder: '',
  rows: 3,
  maxRows: null,
  disabled: false,
  block: false,
  readonly: false,
  required: false,
  helperText: null,
  errorMessage: null,
  rules: () => [],
  validateOnBlur: true,
  validateOnInput: false,
  name: '',
  resize: 'vertical',
  autoResize: false,
})
const { autoId } = useAutoId('textarea', props)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
  validation: [payload: { valid: boolean; error: string; name?: string }]
  mounted: [handlers: { validate: () => boolean; focus: () => void }]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isFocused = ref(false)
const error = ref('')

const textareaClasses = computed(() => ({
  'vsui base-textarea': true,
  [`base-textarea--${props.variant}`]: true,
  [`base-textarea--${inputState.value}`]: inputState.value,
  'base-textarea--disabled': props.disabled,
  'base-textarea--focused': isFocused.value,
  'base-textarea--block': props.block,
  [`base-textarea--resize-${props.resize}`]: true,
}))

type ValidatorResult = { valid: boolean; message: string }

const validators: Record<string, (value: string, arg?: number) => ValidatorResult> = {
  required: (value) => ({
    valid: !!value?.toString().trim(),
    message: 'This field is required',
  }),
  min: (value, min) => ({
    valid: !value || value.toString().length >= (min as number),
    message: `Must be at least ${min} characters`,
  }),
  max: (value, max) => ({
    valid: !value || value.toString().length <= (max as number),
    message: `Must be no more than ${max} characters`,
  }),
}

const validateField = (): boolean => {
  const isValid = validate(props.modelValue)
  emit('validation', { valid: isValid, error: error.value, name: props.name })
  return isValid
}

const validate = (value: string): boolean => {
  if (!props.rules.length) return true

  // console.log('Validating value:', value)
  // console.log('Rules:', props.rules)

  for (const rule of props.rules) {
    if (typeof rule === 'string') {
      const validator = validators[rule]
      if (validator) {
        const result = validator(value)
        if (!result.valid) {
          error.value = result.message
          return false
        }
      }
      continue
    }

    if (typeof rule === 'object') {
      const [validatorName, config] = Object.entries(rule)[0]
      const validator = validators[validatorName]

      if (validator) {
        const result = validator(value, config as number)
        if (!result.valid) {
          error.value = rule.message || result.message
          return false
        }
      }

      if (typeof rule.validator === 'function') {
        const isValid = rule.validator(value)
        if (!isValid) {
          error.value = rule.message || 'Invalid value'
          return false
        }
      }
    }
  }

  error.value = ''
  return true
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  emit('input', event)

  if (props.validateOnInput) {
    const isValid = validate(target.value)
    emit('validation', { valid: isValid, error: error.value })
  }

  if (props.autoResize) {
    autoResize()
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)

  if (props.validateOnBlur) {
    const isValid = validate((event.target as HTMLTextAreaElement).value)
    emit('validation', { valid: isValid, error: error.value })
  }
}

const autoResize = () => {
  if (!textareaRef.value) return

  textareaRef.value.style.height = 'auto'
  let newHeight = textareaRef.value.scrollHeight + 2

  if (props.maxRows) {
    const lineHeight = parseInt(getComputedStyle(textareaRef.value).lineHeight)
    const maxHeight = lineHeight * Number(props.maxRows)
    newHeight = Math.min(newHeight, maxHeight)
  }

  textareaRef.value.style.height = `${newHeight}px`
}

const focus = () => {
  textareaRef.value?.focus()
}

const inputState = computed(() => {
  if (error.value) return 'error'
  return props.state
})

const displayMessage = computed(() => {
  if (error.value) return error.value
  return props.errorMessage || props.helperText
})

const isRequired = computed(() => {
  if (props.required) return true
  return props.rules.some(
    (rule) => rule === 'required' || (typeof rule === 'object' && rule.required),
  )
})

onMounted(() => {
  if (props.autoResize) {
    autoResize()
  }

  emit('mounted', {
    validate: validateField,
    focus,
  })
})
</script>

<template>
  <div :class="textareaClasses">
    <label v-if="label" class="base-textarea__label">
      {{ label }}
      <span v-if="isRequired" class="base-textarea__required" aria-hidden="true">*</span>
    </label>

    <div
      class="base-textarea__wrapper"
      :class="{ 'base-textarea__wrapper--transparent': transparentBg }"
    >
      <textarea
        :id="autoId"
        ref="textareaRef"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="isRequired"
        :aria-required="isRequired"
        class="base-textarea__field"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <div
      v-if="displayMessage"
      class="base-textarea__helper"
      :class="{ 'base-textarea__helper--error': error }"
    >
      {{ displayMessage }}
    </div>
  </div>
</template>

<style lang="scss">
.base-textarea {
  display: inline-flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 20rem;

  &__label {
    font-size: var(--vsui-textarea-label-font-size, 0.875rem);
    font-weight: 500;
    color: var(--vsui-textarea-label-color, #374151);
  }

  &__required {
    color: var(--vsui-textarea-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  &__wrapper {
    position: relative;
    width: 100%;
    border-radius: var(--vsui-textarea-border-radius, 0.375rem);
    border: 1px solid var(--vsui-textarea-border-color, #d1d5db);
    background-color: var(--vsui-textarea-bg, white);
    transition: all 0.2s;
  }

  &__wrapper--transparent {
    background-color: transparent;
  }

  &__field {
    width: 100%;
    padding: var(--vsui-textarea-padding, 0.625rem 0.75rem);
    font-size: var(--vsui-textarea-font-size, 0.875rem);
    line-height: var(--vsui-textarea-line-height, 1.5);
    color: var(--vsui-textarea-text-color, #111827);
    border: none;
    background-color: transparent;
    box-sizing: border-box;
    font-family: var(--vsui-font-family-base, inherit);

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: var(--vsui-textarea-placeholder-color, #9ca3af);
    }
  }

  &__helper {
    font-size: var(--vsui-textarea-helper-font-size, 0.75rem);
    color: var(--vsui-textarea-helper-color, #6b7280);
  }

  &--success {
    .base-textarea__wrapper {
      border-color: var(--vsui-textarea-success-color, #22c55e) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-textarea-success-ring-color, rgba(34, 197, 94, 0.1));
      }
    }
    .base-textarea__helper {
      color: var(--vsui-textarea-success-color, #22c55e);
    }
  }

  &--error {
    .base-textarea__wrapper {
      border-color: var(--vsui-textarea-error-color, #ef4444) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-textarea-error-ring-color, rgba(239, 68, 68, 0.1));
      }
    }
    .base-textarea__helper {
      color: var(--vsui-textarea-error-color, #ef4444);
    }
  }

  &--warning {
    .base-textarea__wrapper {
      border-color: var(--vsui-textarea-warning-color, #f59e0b) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--vsui-textarea-warning-ring-color, rgba(245, 158, 11, 0.1));
      }
    }
    .base-textarea__helper {
      color: var(--vsui-textarea-warning-color, #f59e0b);
    }
  }

  &__wrapper:focus-within {
    border-color: var(--vsui-textarea-focus-border-color, #3b82f6);
    box-shadow: 0 0 0 3px var(--vsui-textarea-focus-ring-color, rgba(59, 130, 246, 0.1));
  }

  &--filled {
    .base-textarea__wrapper {
      background-color: var(--vsui-textarea-filled-bg, #f3f4f6);
      border-color: transparent;

      &:hover {
        background-color: var(--vsui-textarea-filled-hover-bg, #e5e7eb);
      }

      &:focus-within {
        background-color: var(--vsui-textarea-filled-focus-bg, #f9fafb);
      }
    }
  }

  &--outlined &__wrapper {
    border-width: var(--vsui-textarea-outlined-border-width, 2px);
  }

  &--disabled {
    opacity: var(--vsui-textarea-disabled-opacity, 0.6);
    cursor: not-allowed;

    .base-textarea__field {
      cursor: not-allowed;
    }
  }

  &--block {
    display: flex;
    width: 100%;
  }

  &--resize {
    &-none .base-textarea__field {
      resize: none;
    }
    &-both .base-textarea__field {
      resize: both;
    }
    &-horizontal .base-textarea__field {
      resize: horizontal;
    }
    &-vertical .base-textarea__field {
      resize: vertical;
    }
  }
}
</style>
