<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAutoId } from '../composables/autoId'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [Number, Array],
    default: 0,
  },
  min: {
    type: Number,
    default: 0,
  },
  max: {
    type: Number,
    default: 100,
  },
  step: {
    type: Number,
    default: 1,
  },
  label: {
    type: String,
    default: null,
  },
  disabled: {
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
  state: {
    type: String,
    default: null,
    validator: (value) => ['success', 'error', 'warning'].includes(value),
  },
  showValue: {
    type: Boolean,
    default: true,
  },
  range: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'filled'].includes(value),
  },
  marks: {
    type: Array,
    default: () => [],
  },
  formatValue: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'change', 'mounted'])

const { autoId } = useAutoId('slider', props)

const sliderValue = ref(props.modelValue)
const isDragging = ref(false)
const sliderTrack = ref(null)
const thumbRefs = ref([])

// Computed properties for styling and functionality
const isRange = computed(() => props.range && Array.isArray(props.modelValue))

const displayValue = computed(() => {
  if (props.formatValue) {
    return isRange.value
      ? sliderValue.value.map((v) => props.formatValue(v))
      : props.formatValue(sliderValue.value)
  }
  return sliderValue.value
})

const trackFillStyle = computed(() => {
  if (isRange.value) {
    const [start, end] = sliderValue.value
    const startPercent = ((start - props.min) / (props.max - props.min)) * 100
    const endPercent = ((end - props.min) / (props.max - props.min)) * 100
    return {
      left: `${startPercent}%`,
      width: `${endPercent - startPercent}%`,
    }
  } else {
    const percent = ((sliderValue.value - props.min) / (props.max - props.min)) * 100
    return {
      width: `${percent}%`,
    }
  }
})

const thumbPositions = computed(() => {
  if (isRange.value) {
    return sliderValue.value.map((val) => {
      const percent = ((val - props.min) / (props.max - props.min)) * 100
      return `${percent}%`
    })
  } else {
    const percent = ((sliderValue.value - props.min) / (props.max - props.min)) * 100
    return [`${percent}%`]
  }
})

const sliderClasses = computed(() => {
  return {
    'base-slider--disabled': props.disabled,
    'base-slider--success': props.state === 'success',
    'base-slider--error': props.state === 'error',
    'base-slider--warning': props.state === 'warning',
    'base-slider--filled': props.variant === 'filled',
  }
})

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    sliderValue.value = newValue
  },
)

// Watch for internal changes to update the model
watch(sliderValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// Methods
const updateValue = (event, thumbIndex = 0) => {
  if (props.disabled) return

  const rect = sliderTrack.value.getBoundingClientRect()
  const offsetX = event.clientX - rect.left
  const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1)
  const rawValue = props.min + percentage * (props.max - props.min)
  const steppedValue = Math.round(rawValue / props.step) * props.step
  const clampedValue = Math.min(Math.max(steppedValue, props.min), props.max)

  if (isRange.value) {
    const newValues = [...sliderValue.value]
    newValues[thumbIndex] = clampedValue

    if (thumbIndex === 0 && newValues[0] > newValues[1]) {
      newValues[0] = newValues[1]
    } else if (thumbIndex === 1 && newValues[1] < newValues[0]) {
      newValues[1] = newValues[0]
    }

    sliderValue.value = newValues
  } else {
    sliderValue.value = clampedValue
  }

  emit('change', sliderValue.value)
}

const startDrag = (event, thumbIndex = 0) => {
  if (props.disabled) return

  isDragging.value = true
  updateValue(event, thumbIndex)

  const handleMove = (e) => updateValue(e, thumbIndex)
  const handleEnd = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchmove', handleMove)
    document.removeEventListener('touchend', handleEnd)
  }

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove)
  document.addEventListener('touchend', handleEnd)
}

const handleKeyDown = (event, thumbIndex = 0) => {
  if (props.disabled) return

  const currentValue = isRange.value ? sliderValue.value[thumbIndex] : sliderValue.value
  let newValue = currentValue

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      newValue = Math.min(currentValue + props.step, props.max)
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      newValue = Math.max(currentValue - props.step, props.min)
      break
    case 'Home':
      newValue = props.min
      break
    case 'End':
      newValue = props.max
      break
    default:
      return
  }

  if (isRange.value) {
    const newValues = [...sliderValue.value]
    newValues[thumbIndex] = newValue

    if (thumbIndex === 0 && newValues[0] > newValues[1]) {
      newValues[0] = newValues[1]
    } else if (thumbIndex === 1 && newValues[1] < newValues[0]) {
      newValues[1] = newValues[0]
    }

    sliderValue.value = newValues
  } else {
    sliderValue.value = newValue
  }

  emit('change', sliderValue.value)
  event.preventDefault()
}

onMounted(() => {
  if (isRange.value && (!Array.isArray(sliderValue.value) || sliderValue.value.length !== 2)) {
    sliderValue.value = [props.min, props.max]
  } else if (!isRange.value && Array.isArray(sliderValue.value)) {
    sliderValue.value = props.min
  }

  emit('mounted', {
    id: autoId.value,
    getValue: () => sliderValue.value,
    setValue: (val) => {
      sliderValue.value = val
    },
  })
})
</script>

<template>
  <div class="base-slider" :class="sliderClasses">
    <label v-if="label" :for="autoId" class="base-slider__label">
      {{ label }}
      <span v-if="required" class="base-slider__required">*</span>
    </label>

    <div class="base-slider__container">
      <div class="base-slider__extremity-value base-slider__extremity-value--min">
        {{ formatValue ? formatValue(min) : min }}
      </div>

      <div
        ref="sliderTrack"
        class="base-slider__track"
        @mousedown="updateValue($event)"
        @touchstart.prevent="updateValue($event.touches[0])"
      >
        <div class="base-slider__track-fill" :style="trackFillStyle"></div>

        <div
          v-for="mark in marks"
          :key="mark.value"
          class="base-slider__mark"
          :style="{ left: `calc(${((mark.value - min) / (max - min)) * 100}%)` }"
          :class="{
            'base-slider__mark--active': isRange
              ? mark.value >= sliderValue[0] && mark.value <= sliderValue[1]
              : mark.value <= sliderValue,
          }"
        >
          <div class="base-slider__mark-dot"></div>
          <div v-if="mark.label" class="base-slider__mark-label">{{ mark.label }}</div>
        </div>

        <div
          v-for="(position, index) in thumbPositions"
          :key="index"
          ref="thumbRefs"
          class="base-slider__thumb"
          :style="{ left: position }"
          @mousedown.stop="startDrag($event, index)"
          @touchstart.stop.prevent="startDrag($event.touches[0], index)"
          @keydown="handleKeyDown($event, index)"
          tabindex="0"
          role="slider"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-valuenow="isRange ? sliderValue[index] : sliderValue"
          :aria-valuetext="isRange ? displayValue[index] : displayValue"
          :aria-disabled="disabled"
        >
          <div v-if="showValue" class="base-slider__thumb-value">
            {{ isRange ? displayValue[index] : displayValue }}
          </div>
        </div>
      </div>

      <div class="base-slider__extremity-value base-slider__extremity-value--max">
        {{ formatValue ? formatValue(max) : max }}
      </div>
    </div>

    <div v-if="helperText || errorMessage" class="base-slider__helper">
      {{ errorMessage || helperText }}
    </div>
  </div>
</template>

<style lang="scss">
.base-slider {
  font-family: var(--font-family-base);
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 1rem;

  &__label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: var(--slider-label-font-size, 0.875rem);
    font-weight: 500;
    color: var(--slider-label-color, #374151);
  }

  &__required {
    color: var(--slider-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  &__container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
  }

  &__extremity-value {
    font-size: var(--slider-value-font-size, 0.875rem);
    color: var(--slider-value-color, #374151);
    min-width: 2rem;

    &--min {
      text-align: right;
    }

    &--max {
      text-align: left;
    }
  }

  &__track {
    position: relative;
    height: var(--slider-track-height, 6px);
    flex-grow: 1;
    background-color: var(--slider-track-bg, #e5e7eb);
    border-radius: var(--slider-track-radius, 3px);
    cursor: pointer;
  }

  &__track-fill {
    position: absolute;
    height: 100%;
    background-color: var(--slider-fill-color, #3b82f6);
    border-radius: var(--slider-track-radius, 3px);
    pointer-events: none;
  }

  &__thumb {
    position: absolute;
    top: 50%;
    width: var(--slider-thumb-size, 18px);
    height: var(--slider-thumb-size, 18px);
    background-color: var(--slider-thumb-bg, #ffffff);
    border: var(--slider-thumb-border-width, 2px) solid var(--slider-thumb-border-color, #3b82f6);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: grab;
    box-shadow: var(--slider-thumb-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
    transition:
      box-shadow 0.2s,
      transform 0.1s;

    &:hover {
      transform: translate(-50%, -50%) scale(1.1);
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--slider-focus-ring-color, rgba(59, 130, 246, 0.1));
    }

    &:active {
      cursor: grabbing;
      transform: translate(-50%, -50%) scale(1.1);
    }

    &-value {
      position: absolute;
      top: -28px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--slider-value-bubble-bg, #ffffff);
      color: var(--slider-value-bubble-color, #374151);
      font-size: var(--slider-value-bubble-font-size, 0.75rem);
      padding: var(--slider-value-bubble-padding, 2px 6px);
      border-radius: var(--slider-value-bubble-radius, 4px);
      white-space: nowrap;
      box-shadow: var(--slider-value-bubble-shadow, 0 1px 2px rgba(0, 0, 0, 0.1));
      border: var(--slider-value-bubble-border, 1px solid #3b82f6);
      pointer-events: none;
    }
  }

  &__mark {
    position: absolute;
    top: 100%;
    left: 0;
    transform: translateX(-50%);

    &-dot {
      width: var(--slider-mark-size, 4px);
      height: var(--slider-mark-size, 4px);
      margin-top: 8px;
      background-color: var(--slider-mark-color, #9ca3af);
      border-radius: 50%;
    }

    &-label {
      margin-top: 4px;
      font-size: var(--slider-mark-label-font-size, 0.75rem);
      color: var(--slider-mark-label-color, #6b7280);
      white-space: nowrap;
      text-align: center;
      transform: translateX(-50%);
      position: absolute;
      left: 50%;
      max-width: var(--slider-mark-label-max-width, 80px);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &--active {
      .base-slider__mark-dot {
        background-color: var(--slider-fill-color, #3b82f6);
      }
    }
  }

  &__helper {
    margin-top: 0.25rem;
    font-size: var(--slider-helper-font-size, 0.75rem);
    color: var(--slider-helper-color, #6b7280);
  }

  &--disabled {
    opacity: var(--slider-disabled-opacity, 0.6);
    pointer-events: none;

    .base-slider__track {
      background-color: var(--slider-disabled-track-bg, #f3f4f6);
    }

    .base-slider__thumb {
      background-color: var(--slider-disabled-thumb-bg, #f3f4f6);
      border-color: var(--slider-disabled-thumb-border, #6b7280);
    }
  }

  &--success {
    .base-slider__track-fill {
      background-color: var(--slider-success-color, #22c55e);
    }

    .base-slider__thumb {
      border-color: var(--slider-success-color, #22c55e);

      &:focus {
        box-shadow: 0 0 0 3px var(--slider-success-ring-color, rgba(34, 197, 94, 0.1));
      }

      &-value {
        border-color: var(--slider-success-color, #22c55e);
      }
    }

    .base-slider__helper {
      color: var(--slider-success-color, #22c55e);
    }
  }

  &--error {
    .base-slider__track-fill {
      background-color: var(--slider-error-color, #ef4444);
    }

    .base-slider__thumb {
      border-color: var(--slider-error-color, #ef4444);

      &:focus {
        box-shadow: 0 0 0 3px var(--slider-error-ring-color, rgba(239, 68, 68, 0.1));
      }

      &-value {
        border-color: var(--slider-error-color, #ef4444);
      }
    }

    .base-slider__helper {
      color: var(--slider-error-color, #ef4444);
    }
  }

  &--warning {
    .base-slider__track-fill {
      background-color: var(--slider-warning-color, #f59e0b);
    }

    .base-slider__thumb {
      border-color: var(--slider-warning-color, #f59e0b);

      &:focus {
        box-shadow: 0 0 0 3px var(--slider-warning-ring-color, rgba(245, 158, 11, 0.1));
      }

      &-value {
        border-color: var(--slider-warning-color, #f59e0b);
      }
    }

    .base-slider__helper {
      color: var(--slider-warning-color, #f59e0b);
    }
  }

  &--filled {
    .base-slider__track {
      background-color: var(--slider-filled-bg, #f3f4f6);
    }
  }
}
</style>
