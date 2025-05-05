<script setup>
import { ref, computed, nextTick } from 'vue'
import { useAutoId } from '../composables/autoId'
import BaseInput from './BaseInput.vue'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: String,
    default: '#000000',
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'filled', 'outlined'].includes(value),
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
  rules: {
    type: Array,
    default: () => [],
  },
  name: {
    type: String,
    default: '',
  },
  format: {
    type: String,
    default: 'hex',
    validator: (value) => ['hex', 'rgb', 'rgba', 'hsl'].includes(value),
  },
  showPreview: {
    type: Boolean,
    default: true,
  },
  presets: {
    type: Array,
    default: () => [],
  },
})

const { autoId } = useAutoId('color-picker', props)
const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'input', 'validation', 'mounted'])

const colorPickerRef = ref(null)
const inputRef = ref(null)
const showPicker = ref(false)

const colorValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const colorPickerClasses = computed(() => ({
  'vsui base-color-picker': true,
  'base-color-picker--disabled': props.disabled,
  'base-color-picker--open': showPicker.value,
}))

const handleInput = (value) => {
  colorValue.value = value
  emit('input', { target: { value } })
}

const handleColorChange = (event) => {
  const newValue = event.target.value

  colorValue.value = newValue

  emit('input', { target: { value: newValue } })

  nextTick(() => {
    if (inputRef.value?.validate) {
      inputRef.value.validate()
    }
  })
}

const handleFocus = (event) => {
  emit('focus', event)
}

const handleBlur = (event) => {
  // Delay blur action to handle potential picker clicks
  setTimeout(() => {
    if (showPicker.value && !colorPickerRef.value?.contains(document.activeElement)) {
      showPicker.value = false
    }
    emit('blur', event)
  }, 100)
}

const toggleColorPicker = () => {
  if (!props.disabled && !props.readonly) {
    showPicker.value = !showPicker.value
    if (showPicker.value) {
      nextTick(() => {
        colorPickerRef.value?.focus()
      })
    }
  }
}

const selectPresetColor = (color) => {
  colorValue.value = color
  emit('input', { target: { value: color } })

  nextTick(() => {
    if (inputRef.value?.validate) {
      inputRef.value.validate()
    }
  })
}

const focus = () => {
  inputRef.value?.focus()
}

const handleValidation = (validationResult) => {
  emit('validation', validationResult)
}

const handleMounted = (ref) => {
  inputRef.value = ref

  emit('mounted', {
    validate: ref.validate,
    focus,
  })
}

// Default color presets if none are provided
const defaultPresets = [
  '#3b82f6',
  '#9333ea',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#111827',
  '#374151',
  '#6b7280',
  '#f3f4f6',
  '#ffffff',
]

const colorPresets = computed(() => {
  return props.presets.length > 0 ? props.presets : defaultPresets
})

const computedRules = computed(() => {
  const formatRules = {
    hex: 'hexColor',
    rgb: 'rgbColor',
    rgba: 'rgbaColor',
    hsl: 'hslColor',
  }

  const currentFormatRule = formatRules[props.format]

  const hasFormatRule = props.rules.some((rule) => {
    if (typeof rule === 'string' && rule === currentFormatRule) return true

    if (typeof rule === 'object' && rule !== null) {
      return Object.keys(rule).some((key) => key === currentFormatRule)
    }

    return false
  })

  if (hasFormatRule) return props.rules

  return [...props.rules, currentFormatRule]
})
</script>

<template>
  <div :class="colorPickerClasses">
    <div class="base-color-picker__container">
      <BaseInput
        :id="autoId"
        :modelValue="colorValue"
        :variant="variant"
        :state="state"
        :label="label"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :helperText="helperText"
        :errorMessage="errorMessage"
        :rules="computedRules"
        :name="name"
        @update:modelValue="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @validation="handleValidation"
        @mounted="handleMounted"
      >
        <template #prefix v-if="showPreview">
          <div
            class="base-color-picker__preview"
            :style="{ backgroundColor: colorValue }"
            @click="toggleColorPicker"
          ></div>
        </template>

        <template #suffix>
          <div class="base-color-picker__icon" @click="toggleColorPicker">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </template>
      </BaseInput>

      <div
        v-if="showPicker"
        ref="colorPickerRef"
        class="base-color-picker__popup"
        tabindex="-1"
        @blur="handleBlur"
      >
        <input
          type="color"
          :value="colorValue"
          class="base-color-picker__color-input"
          @input="handleColorChange"
        />

        <div v-if="colorPresets.length > 0" class="base-color-picker__presets">
          <div
            v-for="(color, index) in colorPresets"
            :key="index"
            class="base-color-picker__preset"
            :style="{ backgroundColor: color }"
            :class="{ 'base-color-picker__preset--active': colorValue === color }"
            @click="selectPresetColor(color)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.base-color-picker {
  position: relative;
  width: 100%;

  &__container {
    position: relative;
    width: 100%;
  }

  // Color preview
  &__preview {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    border: 1px solid rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--input-icon-color, #6b7280);
    cursor: pointer;
  }

  // Popup styles
  &__popup {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.5rem;
    background-color: var(--surface-default, white);
    border: 1px solid var(--border-default, #e5e7eb);
    border-radius: 0.375rem;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 10;
    padding: 1rem;
    min-width: 240px;
  }

  &__color-input {
    width: 100%;
    height: 40px;
    border: none;
    padding: 0;
    background-color: transparent;
    cursor: pointer;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: 1px solid var(--border-default, #e5e7eb);
      border-radius: 0.25rem;
    }
  }

  // Presets styles
  &__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  &__preset {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 0.25rem;
    border: 1px solid var(--border-default, #e5e7eb);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.1);
    }

    &--active {
      box-shadow: 0 0 0 2px var(--color-primary, #3b82f6);
    }
  }

  // Disabled state
  &--disabled {
    .base-color-picker__preview,
    .base-color-picker__icon {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}
</style>
