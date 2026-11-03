<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAutoId } from '../composables/autoId'
import { useFloatingMenu } from '../composables/floatingMenu'
import {
  CALENDAR_OPTION_DEFAULTS,
  DEFAULT_CALENDAR_LABELS,
  createDateCodec,
  formatDate,
  isDateUnavailable,
  isValidISODate,
  localeDateFormat,
  resolveDisabledOptions,
  type CalendarDatePayload,
  type CalendarOptionProps,
  type CalendarRangePayload,
  type CalendarValue,
  type DisplayDateFormat,
} from '../composables/calendar'
import BaseCalendar, { type CalendarApi } from './BaseCalendar.vue'
import BaseInput from './BaseInput.vue'

export type DatePickerMode = 'single' | 'range'
export type DatePickerVariant = 'default' | 'filled' | 'outlined'
export type DatePickerState = 'success' | 'error' | 'warning'

interface InputInstance {
  validate: () => boolean
  focus: () => void
}

interface Props extends CalendarOptionProps {
  id?: string
  modelValue?: CalendarValue
  mode?: DatePickerMode
  variant?: DatePickerVariant
  state?: DatePickerState | null
  label?: string | null
  /** Defaults to the display format (e.g. DD/MM/YYYY). */
  placeholder?: string | null
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  helperText?: string | null
  errorMessage?: string | null
  rules?: (string | Record<string, unknown>)[]
  validateOnBlur?: boolean
  validateOnInput?: boolean
  name?: string
  /** What the user sees and types. Defaults to the order that suits `locale`. */
  displayFormat?: DisplayDateFormat | null
  clearable?: boolean
  closeOnSelect?: boolean
  /** Controls the popover from outside (`v-model:open`). */
  open?: boolean
  teleport?: boolean
  teleportTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  ...CALENDAR_OPTION_DEFAULTS,
  id: '',
  modelValue: null,
  mode: 'single',
  variant: 'default',
  state: null,
  label: null,
  placeholder: null,
  disabled: false,
  readonly: false,
  required: false,
  helperText: null,
  errorMessage: null,
  rules: () => [],
  validateOnBlur: true,
  validateOnInput: false,
  name: '',
  displayFormat: null,
  clearable: false,
  closeOnSelect: true,
  open: false,
  teleport: true,
  teleportTo: 'body',
})

const { autoId } = useAutoId('date-picker', props)

const emit = defineEmits<{
  'update:modelValue': [value: CalendarValue]
  'update:open': [open: boolean]
  /** A date (or range) was picked or typed; `null` when the field was cleared. */
  change: [payload: CalendarDatePayload | CalendarRangePayload | null]
  open: []
  close: []
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  validation: [result: { valid: boolean; error: string; name?: string }]
  mounted: [
    api: { validate: () => boolean; focus: () => void; open: () => void; close: () => void },
  ]
}>()

const codec = createDateCodec(() => props)
const labels = computed(() => ({ ...DEFAULT_CALENDAR_LABELS, ...props.labels }))

const rootRef = ref<HTMLElement | null>(null)
const anchorRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const calendarRef = ref<CalendarApi | null>(null)
const inputRef = ref<InputInstance | null>(null)

const isOpen = ref(false)

const displayFmt = computed<DisplayDateFormat>(
  () => props.displayFormat ?? localeDateFormat(props.locale),
)

// --- Value shown in the field ---------------------------------------------------------------

const singleISO = computed(() => (props.mode === 'single' ? codec.toISO(props.modelValue) : null))

const rangeISO = computed(() => {
  const value = props.modelValue
  if (props.mode !== 'range' || !value || typeof value !== 'object' || Array.isArray(value)) {
    return { start: null, end: null }
  }
  const range = value as { start?: unknown; end?: unknown }
  return { start: codec.toISO(range.start), end: codec.toISO(range.end) }
})

// What the user is typing while it is not (yet) a valid date. BaseInput's date mask works on
// digits until it has eight of them, so that is also what is handed back to it.
const draft = ref<string | null>(null)
const typedError = ref('')

const inputValue = computed(() => {
  if (props.mode === 'range') {
    const { start, end } = rangeISO.value
    if (!start) return ''
    const from = formatDate(start, displayFmt.value)
    return end ? `${from} – ${formatDate(end, displayFmt.value)}` : `${from} –`
  }
  return draft.value ?? singleISO.value ?? ''
})

const placeholderText = computed(() => {
  if (props.placeholder !== null) return props.placeholder
  return props.mode === 'range' ? `${displayFmt.value} – ${displayFmt.value}` : displayFmt.value
})

const hasValue = computed(() =>
  props.mode === 'range' ? !!rangeISO.value.start : !!singleISO.value || !!draft.value,
)

const effectiveState = computed(() => (typedError.value ? 'error' : props.state))

const emptyValue = (): CalendarValue => (props.mode === 'range' ? { start: null, end: null } : null)

// Remembers what this component last emitted, to tell its own updates from the parent's.
let lastEmitted = ''

const commit = (value: CalendarValue) => {
  lastEmitted = JSON.stringify(value)
  emit('update:modelValue', value)
}

watch(
  () => props.modelValue,
  (value) => {
    if (JSON.stringify(value) !== lastEmitted) {
      draft.value = null
      typedError.value = ''
    }
  },
  { deep: true },
)

const validateInput = () => nextTick(() => inputRef.value?.validate())

// --- Typing (single mode) -------------------------------------------------------------------

const unavailable = (iso: string) => isDateUnavailable(iso, resolveDisabledOptions(props, codec))

const handleTyped = (raw: string | number) => {
  if (props.mode !== 'single') return
  const text = String(raw ?? '')

  if (text === '') {
    draft.value = null
    typedError.value = ''
    if (hasValue.value) {
      commit(null)
      emit('change', null)
    }
    return
  }

  // A complete date arrives from BaseInput as YYYY-MM-DD (its value format).
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    if (!isValidISODate(text)) {
      draft.value = text
      typedError.value = labels.value.invalidDate
      return
    }
    if (unavailable(text)) {
      draft.value = text
      typedError.value = labels.value.dateUnavailable
      return
    }

    draft.value = null
    typedError.value = ''
    commit(codec.fromISO(text) as CalendarValue)
    emit('change', codec.payload(text))
    return
  }

  // Still incomplete: whatever was selected before no longer matches the field.
  draft.value = text
  typedError.value = ''
  if (singleISO.value) {
    commit(null)
    emit('change', null)
  }
}

// --- Popover --------------------------------------------------------------------------------

const { floatingStyle, updatePosition, startTracking, stopTracking } = useFloatingMenu({
  anchorRef,
  menuRef: panelRef,
  align: 'start',
  offset: 4,
  enabled: () => props.teleport,
})

let resizeObserver: ResizeObserver | null = null

const handleClickOutside = (event: MouseEvent) => {
  // The calendar swaps its content on click (month/year pickers), so by the time this runs the
  // clicked button may be gone from the DOM and `contains(target)` would say "outside". The
  // event path was recorded when the click started and still names the real ancestors.
  const path = event.composedPath()
  if (
    (rootRef.value && path.includes(rootRef.value)) ||
    (panelRef.value && path.includes(panelRef.value))
  ) {
    return
  }
  close(false)
}

// Capture phase: the date picker claims Escape before an enclosing popup can react to it.
const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  event.preventDefault()
  event.stopPropagation()
  close()
}

const open = () => {
  if (props.disabled || props.readonly || isOpen.value) return

  isOpen.value = true
  emit('update:open', true)
  emit('open')

  nextTick(() => {
    updatePosition()
    startTracking()
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleDocumentKeydown, true)

    if (panelRef.value && typeof ResizeObserver !== 'undefined') {
      // The calendar changes height with the month; keep the panel attached to the field.
      resizeObserver = new ResizeObserver(() => updatePosition())
      resizeObserver.observe(panelRef.value)
    }

    calendarRef.value?.focus()
  })
}

const teardown = () => {
  stopTracking()
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleDocumentKeydown, true)
  resizeObserver?.disconnect()
  resizeObserver = null
}

const close = (returnFocus = true) => {
  if (!isOpen.value) return

  isOpen.value = false
  teardown()
  emit('update:open', false)
  emit('close')

  if (returnFocus) inputRef.value?.focus()
}

const toggle = () => (isOpen.value ? close() : open())

watch(
  () => props.open,
  (value) => (value ? open() : close(false)),
)

watch(
  () => props.disabled || props.readonly,
  (locked) => {
    if (locked) close(false)
  },
)

onMounted(() => {
  anchorRef.value =
    rootRef.value?.querySelector<HTMLElement>('.base-input__wrapper') ?? rootRef.value
  if (props.open) open()
})

onBeforeUnmount(teardown)

// --- Calendar events ------------------------------------------------------------------------

const handleCalendarModel = (value: CalendarValue) => {
  draft.value = null
  typedError.value = ''
  commit(value)
  validateInput()
}

const handleCalendarSelect = (payload: CalendarDatePayload | CalendarRangePayload) => {
  emit('change', payload)

  const complete = props.mode === 'range' ? !!(payload as CalendarRangePayload).end : true
  if (props.closeOnSelect && complete) close()
}

const clear = () => {
  if (props.disabled || props.readonly) return
  draft.value = null
  typedError.value = ''
  commit(emptyValue())
  emit('change', null)
  emit('clear')
  validateInput()
}

// --- Field events ---------------------------------------------------------------------------

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)

  // Moving to the calendar button or the popover is not leaving the field.
  const next = event.relatedTarget as Node | null
  const staysInside = !!next && (rootRef.value?.contains(next) || panelRef.value?.contains(next))
  if (
    props.mode === 'single' &&
    draft.value !== null &&
    !typedError.value &&
    !staysInside &&
    !isOpen.value
  ) {
    typedError.value = labels.value.invalidDate
  }
}

// A readonly range field has nothing to type, so the whole field opens the calendar.
const handleRootClick = (event: MouseEvent) => {
  if (props.mode !== 'range') return
  if ((event.target as Element).closest('button')) return
  toggle()
}

const handleRootKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown' && !isOpen.value) {
    event.preventDefault()
    open()
  } else if (props.mode === 'range' && (event.key === 'Enter' || event.key === ' ')) {
    if ((event.target as Element).closest('button')) return
    event.preventDefault()
    toggle()
  }
}

const handleMounted = (api: InputInstance) => {
  inputRef.value = api
  emit('mounted', { validate: api.validate, focus, open, close })
}

const focus = () => inputRef.value?.focus()
const validate = () => inputRef.value?.validate() ?? true

defineExpose({ focus, validate, open, close, clear })

// Everything the calendar needs, picked from this component's props.
const calendarProps = computed(() => ({
  mode: props.mode,
  valueFormat: props.valueFormat,
  serialize: props.serialize,
  parse: props.parse,
  min: props.min,
  max: props.max,
  disabledDates: props.disabledDates,
  disabledWeekdays: props.disabledWeekdays,
  isDateDisabled: props.isDateDisabled,
  minRange: props.minRange,
  maxRange: props.maxRange,
  locale: props.locale,
  firstDayOfWeek: props.firstDayOfWeek,
  weekdayFormat: props.weekdayFormat,
  viewDate: props.viewDate,
  showOutsideDays: props.showOutsideDays,
  fixedWeeks: props.fixedWeeks,
  showWeekNumbers: props.showWeekNumbers,
  highlightToday: props.highlightToday,
  showTodayButton: props.showTodayButton,
  showClearButton: props.showClearButton,
  size: props.size,
  labels: props.labels,
}))

const classes = computed(() => ({
  'vsui base-date-picker': true,
  [`base-date-picker--${props.variant}`]: true,
  'base-date-picker--open': isOpen.value,
  'base-date-picker--disabled': props.disabled,
  'base-date-picker--range': props.mode === 'range',
}))
</script>

<template>
  <div ref="rootRef" :class="classes" @click="handleRootClick" @keydown="handleRootKeydown">
    <BaseInput
      :id="autoId"
      :modelValue="inputValue"
      :variant="variant"
      :state="effectiveState"
      :label="label"
      :placeholder="placeholderText"
      :disabled="disabled"
      :readonly="readonly || mode === 'range'"
      :required="required"
      :helperText="helperText"
      :errorMessage="typedError || errorMessage"
      :rules="rules"
      :validateOnBlur="validateOnBlur"
      :validateOnInput="validateOnInput"
      :name="name"
      :mask="mode === 'single' ? 'date' : null"
      :dateDisplayFormat="displayFmt"
      dateValueFormat="YYYY-MM-DD"
      @update:modelValue="handleTyped"
      @focus="emit('focus', $event)"
      @blur="handleBlur"
      @validation="emit('validation', $event)"
      @mounted="handleMounted"
    >
      <template #suffix>
        <div class="base-date-picker__actions">
          <button
            v-if="clearable && hasValue && !disabled && !readonly"
            type="button"
            class="base-date-picker__button base-date-picker__clear"
            :aria-label="labels.clearDate"
            @click="clear"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <button
            type="button"
            class="base-date-picker__button base-date-picker__toggle"
            :aria-label="labels.openCalendar"
            aria-haspopup="dialog"
            :aria-expanded="isOpen"
            :disabled="disabled || readonly"
            @click="toggle"
          >
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
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>
      </template>
    </BaseInput>

    <Teleport :to="teleportTo" :disabled="!teleport">
      <div
        v-if="isOpen"
        ref="panelRef"
        class="base-date-picker__panel"
        :class="{ vsui: teleport, 'base-date-picker__panel--floating': teleport }"
        :data-vsui-floating="teleport ? '' : null"
        :style="floatingStyle"
        role="dialog"
        :aria-label="label || labels.openCalendar"
      >
        <BaseCalendar
          ref="calendarRef"
          v-bind="calendarProps"
          :modelValue="modelValue"
          @update:modelValue="handleCalendarModel"
          @select="handleCalendarSelect"
        >
          <template v-if="$slots.day" #day="slotProps">
            <slot name="day" v-bind="slotProps" />
          </template>
          <template v-if="$slots.footer" #footer>
            <slot name="footer" />
          </template>
        </BaseCalendar>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss">
.base-date-picker {
  position: relative;
  width: 100%;

  &--range .base-input__wrapper,
  &--range input {
    cursor: pointer;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  &__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.125rem;
    border: none;
    border-radius: 0.25rem;
    background: transparent;
    color: var(--vsui-input-icon-color, #6b7280);
    cursor: pointer;

    &:hover:not(:disabled) {
      color: var(--vsui-text-default, #111827);
    }

    &:focus-visible {
      outline: 2px solid var(--vsui-calendar-focus-ring, var(--vsui-color-primary, #3b82f6));
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  &__panel {
    // Without a teleport the panel hangs below the field; teleported, it is positioned
    // by useFloatingMenu (position: fixed).
    position: absolute;
    top: 100%;
    left: 0;
    z-index: var(--vsui-floating-z-index, 1100);
    margin-top: 0.25rem;
    border: 1px solid var(--vsui-calendar-border-color, var(--vsui-border-default, #e5e7eb));
    border-radius: var(--vsui-calendar-radius, 0.5rem);
    background-color: var(--vsui-calendar-bg, var(--vsui-bg-default, #ffffff));
    box-shadow: var(
      --vsui-calendar-popover-shadow,
      0 10px 25px -5px rgba(0, 0, 0, 0.15),
      0 8px 10px -6px rgba(0, 0, 0, 0.1)
    );

    .base-calendar {
      display: block;
      border: none;
    }

    &--floating {
      position: fixed;
      margin-top: 0;
    }
  }
}
</style>
