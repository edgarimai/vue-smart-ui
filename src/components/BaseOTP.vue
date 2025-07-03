<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAutoId } from '../composables/autoId'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: '',
  },
  length: {
    type: Number,
    default: 6,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'filled'].includes(value),
  },
  state: {
    type: String,
    default: null,
    validator: (value) => ['success', 'error', 'warning'].includes(value),
  },
  label: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  helperText: {
    type: String,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  autoFocus: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'number',
    validator: (value) => ['text', 'number', 'password'].includes(value),
  },
  instructions: {
    type: String,
    default: 'Press Shift+Backspace to clear all fields',
  },
})
const { autoId } = useAutoId('otp', props)

const emit = defineEmits(['update:modelValue', 'complete', 'validation', 'mounted'])

const inputRefs = ref([])
const isFocused = ref(false)
const hasFocus = computed(() => isFocused.value)
const currentIndex = ref(0)
const error = ref('')

const otpValue = computed({
  get: () => props.modelValue || '',
  set: (value) => emit('update:modelValue', value),
})

const otpArray = computed(() => {
  const chars = otpValue.value.split('')
  return Array.from({ length: props.length }, (_, i) => chars[i] || '')
})

const otpClasses = computed(() => ({
  'vsui base-otp': true,
  [`base-otp--${props.variant}`]: true,
  [`base-otp--${inputState.value}`]: inputState.value,
  'base-otp--disabled': props.disabled,
  'base-otp--focused': hasFocus.value,
}))

const inputClasses = computed(() => ({
  'base-otp__field': true,
  'base-otp__field--focused': isFocused.value,
}))

const errorMessages = {
  incomplete: 'Please enter the complete code',
  partialIncomplete: 'Please complete the code or leave it empty',
}

const validate = () => {
  const isComplete = otpValue.value.length === props.length
  const isEmpty = otpValue.value.length === 0
  const isPartial = !isEmpty && !isComplete

  if (props.required && !isComplete) {
    error.value = props.errorMessage || errorMessages.incomplete
    return false
  }

  if (!props.required && isPartial) {
    error.value = props.errorMessage || errorMessages.partialIncomplete
    return false
  }

  error.value = ''
  return true
}

const inputState = computed(() => {
  if (error.value) return 'error'
  return props.state
})

const displayMessage = computed(() => {
  if (error.value) return error.value
  return props.errorMessage || props.helperText
})

const handleInput = (index, e) => {
  const inputChar = e.target.value.slice(-1)

  const newValue = otpArray.value.map((val, i) => (i === index ? inputChar : val)).join('')
  otpValue.value = newValue

  if (inputChar && index < props.length - 1) {
    inputRefs.value[index + 1].focus()
    currentIndex.value = index + 1
  }

  if (newValue.length === props.length) {
    emit('complete', newValue)
  }

  validate()
  emit('validation', { valid: !error.value, error: error.value })
}

const handleKeydown = (index, e) => {
  if (e.key === 'Backspace') {
    if (e.shiftKey) {
      otpValue.value = ''
      currentIndex.value = 0
      if (inputRefs.value[0]) {
        inputRefs.value[0].focus()
      }
      validate()
      emit('validation', { valid: !error.value, error: error.value })
      return
    }

    if (!otpArray.value[index] && index > 0) {
      inputRefs.value[index - 1].focus()
      currentIndex.value = index - 1
    }
  } else if (e.key === 'Delete' && e.shiftKey) {
    otpValue.value = ''
    currentIndex.value = 0
    if (inputRefs.value[0]) {
      inputRefs.value[0].focus()
    }
    validate()
    emit('validation', { valid: !error.value, error: error.value })
    return
  } else if (e.key === 'ArrowLeft' && index > 0) {
    inputRefs.value[index - 1].focus()
    currentIndex.value = index - 1
  } else if (e.key === 'ArrowRight' && index < props.length - 1) {
    inputRefs.value[index + 1].focus()
    currentIndex.value = index + 1
  }
}

const handlePaste = (e) => {
  e.preventDefault()
  const pastedData = (e.clipboardData || window.clipboardData).getData('text')

  const characters = pastedData.slice(0, props.length).split('')

  const newValue = Array.from(
    { length: props.length },
    (_, i) => characters[i] || otpArray.value[i] || '',
  ).join('')
  otpValue.value = newValue

  const nextEmptyIndex = newValue.length < props.length ? newValue.length : props.length - 1
  if (inputRefs.value[nextEmptyIndex]) {
    inputRefs.value[nextEmptyIndex].focus()
    currentIndex.value = nextEmptyIndex
  }

  validate()
  emit('validation', { valid: !error.value, error: error.value })

  if (newValue.length === props.length) {
    emit('complete', newValue)
  }
}

const handleFocus = (index) => {
  isFocused.value = true
  currentIndex.value = index
}

const handleBlur = () => {
  isFocused.value = false

  validate()
  emit('validation', { valid: !error.value, error: error.value })
}

const reset = () => {
  otpValue.value = ''
  currentIndex.value = 0
  error.value = ''
  if (inputRefs.value[0]) {
    inputRefs.value[0].focus()
  }
}

const focus = () => {
  if (inputRefs.value[0]) {
    inputRefs.value[0].focus()
    currentIndex.value = 0
  }
}

watch(
  () => props.modelValue,
  (newValue) => {
    validate()
    if (newValue === '') {
      currentIndex.value = 0
      error.value = ''
    }
  },
)

onMounted(() => {
  inputRefs.value = Array.from({ length: props.length })

  if (props.autoFocus) {
    setTimeout(() => {
      focus()
    }, 0)
  }

  emit('mounted', {
    validate,
    focus,
    reset,
  })
})
</script>

<template>
  <div :class="otpClasses">
    <label v-if="label" class="base-otp__label">
      {{ label }}
      <span v-if="required" class="base-otp__required" aria-hidden="true">*</span>
    </label>

    <div class="base-otp__wrapper">
      <template v-for="(digit, index) in props.length" :key="index">
        <input
          :ref="(el) => (inputRefs[index] = el)"
          :id="`${autoId}-${index}`"
          :type="props.type"
          v-model="otpArray[index]"
          maxlength="1"
          :disabled="props.disabled"
          :readonly="props.readonly"
          :required="props.required"
          :class="inputClasses"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          @focus="handleFocus(index)"
          @blur="handleBlur"
          @paste="handlePaste"
        />
      </template>
    </div>

    <div
      v-if="displayMessage"
      class="base-otp__helper"
      :class="{ 'base-otp__helper--error': error }"
    >
      {{ displayMessage }}
    </div>

    <div v-if="props.instructions && !error" class="base-otp__instructions">
      {{ props.instructions }}
    </div>
  </div>
</template>

<style lang="scss">
.base-otp {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &__label {
    font-size: var(--input-label-font-size);
    font-weight: 500;
    color: var(--input-label-color, #374151);
    text-align: center;
  }

  &__required {
    color: var(--input-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  &__wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
  }

  &__field {
    width: 3rem;
    height: 3rem;
    padding: 0.625rem 0;
    text-align: center;
    font-size: var(--input-field-font-size, 1.25rem);
    font-weight: 600;
    border-radius: 0.375rem;
    border: 1px solid var(--input-border-color, #d1d5db);
    background-color: var(--input-bg, white);
    color: var(--input-text-color, #374151);
    font-family: var(--font-family-base, inherit);
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: var(--input-focus-border-color, #3b82f6);
      box-shadow: 0 0 0 3px var(--input-focus-ring-color, rgba(59, 130, 246, 0.1));
    }
  }

  &__helper {
    font-size: var(--input-helper-font-size);
    color: var(--input-helper-color, #6b7280);
    text-align: center;
    margin-top: 0.25rem;
  }

  &__instructions {
    font-size: var(--input-helper-font-size, 0.75rem);
    color: var(--input-instruction-color, #9ca3af);
    text-align: center;
    margin-top: 0.25rem;
    font-style: italic;
  }

  &--success {
    .base-otp__field {
      border-color: var(--input-success-color, #22c55e);

      &:focus {
        box-shadow: 0 0 0 3px var(--input-success-ring-color, rgba(34, 197, 94, 0.1));
      }
    }
    .base-otp__helper {
      color: var(--input-success-color, #22c55e);
    }
  }

  &--error {
    .base-otp__field {
      border-color: var(--input-error-color, #ef4444);

      &:focus {
        box-shadow: 0 0 0 3px var(--input-error-ring-color, rgba(239, 68, 68, 0.1));
      }
    }
    .base-otp__helper {
      color: var(--input-error-color, #ef4444);
    }
  }

  &--warning {
    .base-otp__field {
      border-color: var(--input-warning-color, #f59e0b);

      &:focus {
        box-shadow: 0 0 0 3px var(--input-warning-ring-color, rgba(245, 158, 11, 0.1));
      }
    }
    .base-otp__helper {
      color: var(--input-warning-color, #f59e0b);
    }
  }

  &--filled {
    .base-otp__field {
      background-color: var(--input-filled-bg, #f3f4f6);
      border-color: transparent;

      &:hover {
        background-color: var(--input-filled-hover-bg, #e5e7eb);
      }

      &:focus {
        background-color: var(--input-filled-focus-bg, #f9fafb);
      }
    }
  }

  &--outlined .base-otp__field {
    border-width: 2px;
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;

    .base-otp__field {
      cursor: not-allowed;
    }
  }
}
</style>
