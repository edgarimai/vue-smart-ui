<script setup>
import { ref, computed, useSlots, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAutoId } from '../composables/autoId'

const slots = useSlots()
const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  modelValue: {
    type: [String, Number, Object, Array],
    default: null,
  },
  options: {
    type: Array,
    default: () => [],
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
  placeholder: {
    type: String,
    default: 'Select an option...',
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
  prefixIcon: {
    type: String,
    default: null,
  },
  suffixIcon: {
    type: String,
    default: null,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  validateOnBlur: {
    type: Boolean,
    default: true,
  },
  validateOnInput: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: '',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  searchable: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  valueKey: {
    type: String,
    default: 'value',
  },
  labelKey: {
    type: String,
    default: 'label',
  },
  noDataText: {
    type: String,
    default: 'No options found',
  },
  maxHeight: {
    type: String,
    default: '200px',
  },
  minDropdownWidth: {
    type: [String, Number],
    default: 200,
  },
  wrapOptionText: {
    type: Boolean,
    default: true,
  },
  closeOnSelect: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showTags: {
    type: Boolean,
    default: false,
  },
  removeSpecialChars: {
    type: Boolean,
    default: false,
  },
})

const { autoId } = useAutoId('combobox', props)

const emit = defineEmits([
  'update:modelValue',
  'focus',
  'blur',
  'input',
  'validation',
  'mounted',
  'search',
  'clear',
  'select',
])

const comboboxRef = ref(null)
const inputRef = ref(null)
const menuRef = ref(null)
const isFocused = ref(false)
const isOpen = ref(false)
const error = ref('')
const searchQuery = ref('')
const highlightedIndex = ref(-1)

const validators = {
  required: (value) => ({
    valid: !!value || (Array.isArray(value) && value.length > 0),
    message: 'This field is required',
  }),
  minLength: (value, min) => ({
    valid: !value || value.length >= min,
    message: `Must be at least ${min} characters`,
  }),
  maxLength: (value, max) => ({
    valid: !value || value.length <= max,
    message: `Must be no more than ${max} characters`,
  }),
}

const validate = (value) => {
  if (!props.rules.length) return true

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
        const result = validator(value, config)
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

// Helper functions for options
const getValue = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.valueKey]
  }
  return option
}

const getLabel = (option) => {
  if (typeof option === 'object' && option !== null) {
    return option[props.labelKey] || option[props.valueKey] || String(option)
  }
  return String(option)
}

const stripSpecialChars = (text) => {
  return text
    .replace(/[^\w\s]/g, '')
    .toLowerCase()
    .trim()
}

// Computed properties
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.options
  }
  console.log(props.removeSpecialChars)
  const query = props.removeSpecialChars
    ? stripSpecialChars(searchQuery.value)
    : searchQuery.value.toLowerCase().trim()
  return props.options.filter((option) => {
    const label = props.removeSpecialChars
      ? stripSpecialChars(getLabel(option))
      : getLabel(option).toLowerCase()
    return label.includes(query)
  })
})

const selectedOptions = computed(() => {
  if (!props.modelValue) return []

  if (props.multiple) {
    if (!Array.isArray(props.modelValue)) return []
    return props.modelValue.map((value) => {
      if (typeof value === 'object') return value
      return props.options.find((opt) => getValue(opt) === value) || value
    })
  } else {
    if (typeof props.modelValue === 'object') return [props.modelValue]
    const option = props.options.find((opt) => getValue(opt) === props.modelValue)
    return option ? [option] : []
  }
})

const displayText = computed(() => {
  if (props.searchable && isFocused.value && isOpen.value) {
    return searchQuery.value
  }

  if (!selectedOptions.value.length) {
    return ''
  }

  if (props.multiple) {
    if (!props.showTags && selectedOptions.value.length > 0) {
      return selectedOptions.value.length === 1
        ? '1 item selected'
        : `${selectedOptions.value.length} items selected`
    }
    return ''
  } else {
    return getLabel(selectedOptions.value[0])
  }
})

const comboboxClasses = computed(() => ({
  'vsui base-combobox': true,
  [`base-combobox--${props.variant}`]: true,
  [`base-combobox--${inputState.value}`]: inputState.value,
  'base-combobox--disabled': props.disabled,
  'base-combobox--focused': isFocused.value,
  'base-combobox--open': isOpen.value,
  'base-combobox--multiple': props.multiple,
  'base-combobox--with-prefix': props.prefixIcon || slots.prefix,
  'base-combobox--with-suffix': props.suffixIcon || slots.suffix || props.clearable,
}))

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
  return props.rules.some((rule) => {
    if (rule === 'required') return true
    if (typeof rule === 'object') {
      return rule.required || Object.keys(rule)[0] === 'required'
    }
    return false
  })
})

const showClearButton = computed(() => {
  return (
    props.clearable &&
    !props.disabled &&
    !props.readonly &&
    ((props.multiple && selectedOptions.value.length > 0) || (!props.multiple && props.modelValue))
  )
})

let cachedViewport = null
let positionUpdateTimeout = null

const throttledUpdatePosition = () => {
  if (positionUpdateTimeout) return

  positionUpdateTimeout = setTimeout(() => {
    updatePosition()
    positionUpdateTimeout = null
  }, 16) // ~60fps
}

const updatePosition = () => {
  if (!menuRef.value || !comboboxRef.value) return

  const comboboxRect = comboboxRef.value.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  if (
    !cachedViewport ||
    cachedViewport.width !== viewport.width ||
    cachedViewport.height !== viewport.height
  ) {
    cachedViewport = viewport
  }

  const minDropdownWidth =
    typeof props.minDropdownWidth === 'string'
      ? parseInt(props.minDropdownWidth)
      : props.minDropdownWidth
  const dropdownWidth = Math.max(comboboxRect.width, minDropdownWidth)

  menuRef.value.style.width = `${dropdownWidth}px`

  menuRef.value.style.top = '100%'
  menuRef.value.style.bottom = 'auto'
  menuRef.value.style.left = '0'
  menuRef.value.style.right = 'auto'
  menuRef.value.style.marginTop = '0.25rem'
  menuRef.value.style.marginBottom = '0'

  if (comboboxRect.left + dropdownWidth > cachedViewport.width) {
    menuRef.value.style.right = '0'
    menuRef.value.style.left = 'auto'
  }

  const menuHeight = menuRef.value.offsetHeight
  if (comboboxRect.bottom + menuHeight > cachedViewport.height) {
    menuRef.value.style.bottom = '100%'
    menuRef.value.style.top = 'auto'
    menuRef.value.style.marginTop = '0'
    menuRef.value.style.marginBottom = '0.25rem'
  }
}

const openDropdown = () => {
  if (props.disabled || props.readonly) return

  isOpen.value = true
  highlightedIndex.value = -1

  nextTick(() => {
    if (props.searchable) {
      searchQuery.value = ''
      inputRef.value?.focus()
    }
    updatePosition()
    document.addEventListener('click', handleClickOutside)
  })
}

const closeDropdown = () => {
  isOpen.value = false
  highlightedIndex.value = -1
  searchQuery.value = ''
  document.removeEventListener('click', handleClickOutside)
}

const handleClickOutside = (event) => {
  if (
    comboboxRef.value &&
    !comboboxRef.value.contains(event.target) &&
    menuRef.value &&
    !menuRef.value.contains(event.target)
  ) {
    closeDropdown()
    handleBlur()
  }
}

const handleInputClick = () => {
  if (props.disabled || props.readonly) return

  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  if (!isOpen.value) {
    isFocused.value = false
    emit('blur', event)

    if (props.validateOnBlur) {
      const isValid = validate(props.modelValue)
      emit('validation', { valid: isValid, error: error.value })
    }
  }
}

const handleInput = (event) => {
  searchQuery.value = event.target.value
  highlightedIndex.value = -1
  emit('search', searchQuery.value)
  emit('input', event)

  if (props.validateOnInput) {
    const isValid = validate(props.modelValue)
    emit('validation', { valid: isValid, error: error.value })
  }
}

const selectOption = (option) => {
  const value = getValue(option)
  let newModelValue

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const existingIndex = currentValues.findIndex((val) =>
      typeof val === 'object' ? getValue(val) === value : val === value,
    )

    if (existingIndex >= 0) {
      currentValues.splice(existingIndex, 1)
    } else {
      currentValues.push(value)
    }

    newModelValue = currentValues
  } else {
    newModelValue = value
  }

  emit('update:modelValue', newModelValue)

  if (props.closeOnSelect) {
    closeDropdown()
  }

  emit('select', option)

  if (props.validateOnInput) {
    const isValid = validate(newModelValue)
    emit('validation', { valid: isValid, error: error.value })
  }
}

const isOptionSelected = (option) => {
  const value = getValue(option)

  if (props.multiple) {
    if (!Array.isArray(props.modelValue)) return false
    return props.modelValue.some((val) =>
      typeof val === 'object' ? getValue(val) === value : val === value,
    )
  } else {
    if (typeof props.modelValue === 'object') {
      return getValue(props.modelValue) === value
    }
    return props.modelValue === value
  }
}

const clearSelection = () => {
  emit('update:modelValue', props.multiple ? [] : null)
  emit('clear')

  if (props.validateOnInput) {
    const isValid = validate(props.multiple ? [] : null)
    emit('validation', { valid: isValid, error: error.value })
  }
}

const removeOption = (option) => {
  if (!props.multiple) return

  const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const value = getValue(option)
  const index = currentValues.findIndex((val) =>
    typeof val === 'object' ? getValue(val) === value : val === value,
  )

  if (index >= 0) {
    currentValues.splice(index, 1)
    emit('update:modelValue', currentValues)
  }
}

const handleKeydown = (event) => {
  if (props.disabled || props.readonly) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        openDropdown()
      } else {
        highlightedIndex.value = Math.min(
          highlightedIndex.value + 1,
          filteredOptions.value.length - 1,
        )
      }
      break

    case 'ArrowUp':
      event.preventDefault()
      if (isOpen.value) {
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
      }
      break

    case 'Enter':
      event.preventDefault()
      if (isOpen.value && highlightedIndex.value >= 0) {
        selectOption(filteredOptions.value[highlightedIndex.value])
      } else if (!isOpen.value) {
        openDropdown()
      }
      break

    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break

    case 'Tab':
      if (isOpen.value) {
        closeDropdown()
      }
      break
  }
}

const validateField = () => {
  const isValid = validate(props.modelValue)
  emit('validation', { valid: isValid, error: error.value, name: props.name })
  return isValid
}

const focus = () => {
  if (props.searchable && isOpen.value) {
    inputRef.value?.focus()
  } else {
    comboboxRef.value?.focus()
  }
}

watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (newValue !== oldValue && props.validateOnInput) {
      validate(newValue)
    }
  },
  { deep: true },
)

onMounted(() => {
  window.addEventListener('scroll', throttledUpdatePosition, true)
  window.addEventListener('resize', throttledUpdatePosition)

  emit('mounted', {
    validate: validateField,
    focus,
    open: openDropdown,
    close: closeDropdown,
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', throttledUpdatePosition, true)
  window.removeEventListener('resize', throttledUpdatePosition)

  if (positionUpdateTimeout) {
    clearTimeout(positionUpdateTimeout)
    positionUpdateTimeout = null
  }
})
</script>

<template>
  <div :class="comboboxClasses">
    <label v-if="label" class="base-combobox__label">
      {{ label }}
      <span v-if="isRequired" class="base-combobox__required" aria-hidden="true">*</span>
    </label>

    <div
      ref="comboboxRef"
      class="base-combobox__wrapper"
      :tabindex="searchable && isOpen ? -1 : 0"
      @click="handleInputClick"
      @focus="handleFocus"
      @keydown="handleKeydown"
    >
      <div v-if="$slots.prefix || prefixIcon" class="base-combobox__prefix">
        <slot name="prefix">
          <i :class="prefixIcon"></i>
        </slot>
      </div>

      <!-- Multiple selection tags -->
      <div v-if="multiple && selectedOptions.length > 0 && showTags" class="base-combobox__tags">
        <span v-for="option in selectedOptions" :key="getValue(option)" class="base-combobox__tag">
          {{ getLabel(option) }}
          <button
            type="button"
            class="base-combobox__tag-remove"
            @click.stop="removeOption(option)"
          >
            ×
          </button>
        </span>
      </div>

      <!-- Input field -->
      <input
        v-if="searchable && (!(multiple && selectedOptions.length > 0 && showTags) || isOpen)"
        :id="autoId"
        ref="inputRef"
        :value="displayText"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly || (!isOpen && !searchable)"
        class="base-combobox__field"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <!-- Display field for non-searchable -->
      <div
        v-else-if="!searchable && !(multiple && selectedOptions.length > 0 && showTags)"
        :id="autoId"
        class="base-combobox__field base-combobox__field--display"
        :class="{ 'base-combobox__field--placeholder': !displayText }"
      >
        {{ displayText || placeholder }}
      </div>

      <div class="base-combobox__suffix">
        <!-- Clear button - always reserve space when clearable is true -->
        <div v-if="clearable" class="base-combobox__clear-container">
          <button
            v-if="showClearButton"
            type="button"
            class="base-combobox__clear"
            @click.stop="clearSelection"
          >
            ×
          </button>
        </div>

        <!-- Loading spinner -->
        <div v-if="loading" class="base-combobox__spinner">
          <div class="spinner"></div>
        </div>

        <!-- Custom suffix -->
        <div v-if="$slots.suffix || suffixIcon" class="base-combobox__suffix-content">
          <slot name="suffix">
            <i :class="suffixIcon"></i>
          </slot>
        </div>

        <!-- Dropdown arrow -->
        <div class="base-combobox__arrow" :class="{ 'base-combobox__arrow--open': isOpen }">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Dropdown menu -->
    <Transition name="combobox-dropdown">
      <div v-show="isOpen" ref="menuRef" class="base-combobox__menu" :style="{ maxHeight }">
        <div v-if="loading" class="base-combobox__loading">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>

        <div v-else-if="filteredOptions.length === 0" class="base-combobox__no-data">
          {{ noDataText }}
        </div>

        <div v-else class="base-combobox__options">
          <div
            v-for="(option, index) in filteredOptions"
            :key="getValue(option)"
            class="base-combobox__option"
            :class="{
              'base-combobox__option--selected': isOptionSelected(option),
              'base-combobox__option--highlighted': highlightedIndex === index,
            }"
            @click.stop="selectOption(option)"
            @mouseenter="highlightedIndex = index"
          >
            <slot name="option" :option="option" :selected="isOptionSelected(option)">
              <span
                class="base-combobox__option-label"
                :class="{ 'base-combobox__option-label--wrap': wrapOptionText }"
              >
                {{ getLabel(option) }}
              </span>
              <!-- <span v-if="isOptionSelected(option)" class="base-combobox__option-check">✓</span> -->
              <svg
                v-if="isOptionSelected(option)"
                class="base-combobox__option-check"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </slot>
          </div>
        </div>
      </div>
    </Transition>

    <div
      v-if="displayMessage"
      class="base-combobox__helper"
      :class="{ 'base-combobox__helper--error': error }"
    >
      {{ displayMessage }}
    </div>
  </div>
</template>

<style lang="scss">
.base-combobox {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: relative;

  // Label styles
  &__label {
    font-size: var(--input-label-font-size, 0.875rem);
    font-weight: 500;
    color: var(--input-label-color, #374151);
  }

  &__required {
    color: var(--input-required-color, #ef4444);
    margin-left: 0.25rem;
  }

  // Wrapper styles
  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    // min-height: 2.5rem;
    border-radius: 0.375rem;
    border: 1px solid var(--input-border-color, #d1d5db);
    background-color: var(--input-bg, white);
    transition: all 0.2s;
    cursor: pointer;
    box-sizing: border-box;

    &:focus {
      outline: none;
    }
  }

  // Field styles
  &__field {
    flex: 1;
    width: 100%;
    min-width: 0;
    padding: 0.625rem 0.75rem;
    font-size: var(--input-field-font-size, 1rem);
    border: none;
    background-color: transparent;
    color: var(--input-text-color, #374151);
    font-family: var(--font-family-base, inherit);
    cursor: inherit;
    box-sizing: border-box;

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: var(--input-placeholder-color, #9ca3af);
    }

    &--display {
      display: flex;
      align-items: center;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &--placeholder {
      color: var(--input-placeholder-color, #9ca3af);
    }
  }

  // Multiple selection tags
  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    background-color: var(--combobox-tag-bg, #e5e7eb);
    color: var(--combobox-tag-text, #374151);
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }

  &__tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1rem;
    height: 1rem;
    background: none;
    border: none;
    border-radius: 50%;
    color: var(--combobox-tag-remove, #6b7280);
    cursor: pointer;
    font-size: 0.75rem;
    line-height: 1;

    &:hover {
      background-color: var(--combobox-tag-remove-hover, #d1d5db);
    }
  }

  // Prefix/Suffix styles
  &__prefix {
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    color: var(--input-icon-color, #6b7280);
    flex-shrink: 0;
  }

  &__suffix {
    display: flex;
    align-items: center;
    padding: 0 0.75rem;
    gap: 0.5rem;
    min-width: 0;
    flex-shrink: 0;
  }

  &__suffix-content {
    display: flex;
    align-items: center;
    color: var(--input-icon-color, #6b7280);
    flex-shrink: 0;
  }

  &__clear-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  &__clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    background: none;
    border: none;
    border-radius: 50%;
    color: var(--input-icon-color, #6b7280);
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;

    &:hover {
      background-color: var(--combobox-clear-hover, #f3f4f6);
    }
  }

  &__arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--input-icon-color, #6b7280);
    transition: transform 0.2s;
    flex-shrink: 0; // Prevent arrow from shrinking

    svg {
      width: 1rem;
      height: 1rem;
    }

    &--open {
      transform: rotate(180deg);
    }
  }

  &__spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0; // Prevent spinner from shrinking
  }

  // Dropdown menu
  &__menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.25rem;
    z-index: 50;
    border-radius: 0.375rem;
    border: 1px solid var(--dropdown-border-color, #e5e7eb);
    background-color: var(--dropdown-bg, #ffffff);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow-y: auto;
    min-width: 100%;
  }

  &__options {
    padding: 0.25rem 0;
  }

  &__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s;
    word-wrap: break-word; // Allow text wrapping if needed

    &:hover,
    &--highlighted {
      background-color: var(--dropdown-item-hover-bg, #f3f4f6);
    }

    &--selected {
      background-color: var(--combobox-option-selected-bg, #eff6ff);
      color: var(--combobox-option-selected-text, #1d4ed8);
    }
  }

  &__option-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 0.5rem;
    color: var(--combobox-option-text-color);

    &--wrap {
      white-space: normal;
      word-break: break-word;
      line-height: 1.4;
    }
  }

  &__option-check {
    flex-shrink: 0;
    font-weight: 600;
    width: 1rem;
    text-align: center;
  }

  &__loading,
  &__no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    color: var(--input-placeholder-color, #9ca3af);
    font-size: 0.875rem;
  }

  // Helper text styles
  &__helper {
    font-size: var(--input-helper-font-size, 0.75rem);
    color: var(--input-helper-color, #6b7280);

    &--error {
      color: var(--input-error-color, #ef4444);
    }
  }

  // States
  &--success {
    .base-combobox__wrapper {
      border-color: var(--input-success-color, #22c55e) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--input-success-ring-color, rgba(34, 197, 94, 0.1));
      }
    }
    .base-combobox__helper {
      color: var(--input-success-color, #22c55e);
    }
  }

  &--error {
    .base-combobox__wrapper {
      border-color: var(--input-error-color, #ef4444) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--input-error-ring-color, rgba(239, 68, 68, 0.1));
      }
    }
    .base-combobox__helper {
      color: var(--input-error-color, #ef4444);
    }
  }

  &--warning {
    .base-combobox__wrapper {
      border-color: var(--input-warning-color, #f59e0b) !important;

      &:focus-within {
        box-shadow: 0 0 0 3px var(--input-warning-ring-color, rgba(245, 158, 11, 0.1));
      }
    }
    .base-combobox__helper {
      color: var(--input-warning-color, #f59e0b);
    }
  }

  &__wrapper:focus-within,
  &--focused &__wrapper {
    border-color: var(--input-focus-border-color, #3b82f6);
    box-shadow: 0 0 0 3px var(--input-focus-ring-color, rgba(59, 130, 246, 0.1));
  }

  // Variants
  &--filled {
    .base-combobox__wrapper {
      background-color: var(--input-filled-bg, #f3f4f6);
      border-color: transparent;

      &:hover {
        background-color: var(--input-filled-hover-bg, #e5e7eb);
      }

      &:focus-within {
        background-color: var(--input-filled-focus-bg, #f9fafb);
      }
    }
  }

  &--outlined &__wrapper {
    border-width: 2px;
  }

  // Disabled state
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;

    .base-combobox__wrapper {
      cursor: not-allowed;
    }

    .base-combobox__field {
      cursor: not-allowed;
    }
  }

  // Multiple selection adjustments
  &--multiple {
    .base-combobox__field {
      min-width: 120px;
    }

    &.base-combobox--with-tags .base-combobox__field {
      padding-left: 0.25rem;
    }
  }
}

// Spinner animation
.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
  color: var(--input-placeholder-color, #9ca3af);
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Animations - Otimizadas para melhor performance
.combobox-dropdown-enter-active,
.combobox-dropdown-leave-active {
  transition:
    opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.combobox-dropdown-enter-from,
.combobox-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.125rem);
}
</style>
