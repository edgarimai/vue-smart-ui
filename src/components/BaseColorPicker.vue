<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useAutoId } from '../composables/autoId'
import BaseInput from './BaseInput.vue'

export type ColorPickerVariant = 'default' | 'filled' | 'outlined'
export type ColorPickerState = 'success' | 'error' | 'warning'
export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl'

interface ColorInputInstance {
  validate: () => void
  focus: () => void
}

interface Props {
  id?: string
  modelValue?: string
  variant?: ColorPickerVariant
  state?: ColorPickerState | null
  label?: string | null
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  helperText?: string | null
  errorMessage?: string | null
  rules?: (string | Record<string, unknown>)[]
  name?: string
  format?: ColorFormat
  showPreview?: boolean
  presets?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  modelValue: '#000000',
  variant: 'default',
  state: null,
  label: null,
  disabled: false,
  readonly: false,
  required: false,
  helperText: null,
  errorMessage: null,
  rules: () => [],
  name: '',
  format: 'hex',
  showPreview: true,
  presets: () => [],
})

const { autoId } = useAutoId('color-picker', props)
const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [payload: { target: { value: string } }]
  validation: [result: unknown]
  mounted: [payload: { validate: () => void; focus: () => void }]
}>()

const colorPickerRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<ColorInputInstance | null>(null)
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

const handleInput = (value: string | number) => {
  const newValue = value as string
  colorValue.value = newValue
  emit('input', { target: { value: newValue } })
}

const handleColorChange = (event: Event) => {
  const newValue = (event.target as HTMLInputElement).value

  colorValue.value = newValue

  emit('input', { target: { value: newValue } })

  nextTick(() => {
    if (inputRef.value?.validate) {
      inputRef.value.validate()
    }
  })
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
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

const selectPresetColor = (color: string) => {
  // Convert preset color to the selected format
  let formattedColor = color

  if (props.format !== 'hex' && color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    if (props.format === 'rgb') formattedColor = `rgb(${r}, ${g}, ${b})`
    else if (props.format === 'rgba') formattedColor = `rgba(${r}, ${g}, ${b}, 1)`
    else if (props.format === 'hsl') {
      const r1 = r / 255
      const g1 = g / 255
      const b1 = b / 255

      const max = Math.max(r1, g1, b1)
      const min = Math.min(r1, g1, b1)
      let h = 0,
        s = 0,
        l = (max + min) / 2

      if (max === min) {
        h = s = 0 // achromatic
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
          case r1:
            h = (g1 - b1) / d + (g1 < b1 ? 6 : 0)
            break
          case g1:
            h = (b1 - r1) / d + 2
            break
          case b1:
            h = (r1 - g1) / d + 4
            break
        }

        h = Math.round(h * 60)
        s = Math.round(s * 100)
        l = Math.round(l * 100)
      }

      formattedColor = `hsl(${h}, ${s}%, ${l}%)`
    }
  }

  colorValue.value = formattedColor
  emit('input', { target: { value: formattedColor } })

  nextTick(() => {
    if (inputRef.value?.validate) {
      inputRef.value.validate()
    }
  })
}

const focus = () => {
  inputRef.value?.focus()
}

const handleValidation = (validationResult: unknown) => {
  emit('validation', validationResult)
}

const handleMounted = (ref: ColorInputInstance) => {
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
    color: var(--vsui-input-icon-color, #6b7280);
    cursor: pointer;
  }

  // Popup styles
  &__popup {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.5rem;
    background-color: var(--vsui-surface-default, white);
    border: 1px solid var(--vsui-border-default, #e5e7eb);
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
      border: 1px solid var(--vsui-border-default, #e5e7eb);
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
    border: 1px solid var(--vsui-border-default, #e5e7eb);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.1);
    }

    &--active {
      box-shadow: 0 0 0 2px var(--vsui-color-primary, #3b82f6);
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
