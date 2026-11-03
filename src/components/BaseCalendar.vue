<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  CALENDAR_OPTION_DEFAULTS,
  DEFAULT_CALENDAR_LABELS,
  addDays,
  addMonths,
  buildMonthGrid,
  compareISO,
  createDateCodec,
  daysInMonth,
  diffInDays,
  formatLongDate,
  formatYear,
  getISOWeek,
  getMonthNames,
  getWeekdayNames,
  isDateUnavailable,
  parseISODate,
  resolveDisabledOptions,
  toISO,
  todayISO,
  weekdayOf,
  type CalendarCell,
  type CalendarDatePayload,
  type CalendarMode,
  type CalendarOptionProps,
  type CalendarRangePayload,
  type CalendarValue,
  type CalendarView,
} from '../composables/calendar'

export interface CalendarApi {
  /** Shows the month of a date (in the model's format) without selecting it. */
  goToDate: (value: unknown) => void
  goToToday: () => void
  focus: () => void
}

interface Props extends CalendarOptionProps {
  modelValue?: CalendarValue
  mode?: CalendarMode
  /** Multiple mode: how many dates can be picked. */
  maxSelections?: number
  disabled?: boolean
  readonly?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  ...CALENDAR_OPTION_DEFAULTS,
  modelValue: null,
  mode: 'single',
  disabled: false,
  readonly: false,
  block: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: CalendarValue]
  select: [payload: CalendarDatePayload | CalendarRangePayload]
  'month-change': [payload: { year: number; month: number }]
  'view-change': [view: CalendarView]
  mounted: [api: CalendarApi]
}>()

const codec = createDateCodec(() => props)

const labels = computed(() => ({ ...DEFAULT_CALENDAR_LABELS, ...props.labels }))

// --- Limits and disabled dates, all normalised to ISO -----------------------------------------

const minISO = computed(() => codec.toISO(props.min))
const maxISO = computed(() => codec.toISO(props.max))

const disabledOptions = computed(() => resolveDisabledOptions(props, codec))

const isUnavailable = (iso: string): boolean => isDateUnavailable(iso, disabledOptions.value)

// --- Selection ------------------------------------------------------------------------------

const orderedPair = (a: string, b: string): [string, string] =>
  compareISO(a, b) <= 0 ? [a, b] : [b, a]

const selectedSingle = computed(() =>
  props.mode === 'single' ? codec.toISO(props.modelValue) : null,
)

const selectedMultiple = computed<string[]>(() => {
  if (props.mode !== 'multiple' || !Array.isArray(props.modelValue)) return []
  return props.modelValue.flatMap((value) => {
    const iso = codec.toISO(value)
    return iso ? [iso] : []
  })
})

const selectedRange = computed<{ start: string | null; end: string | null }>(() => {
  const value = props.modelValue
  if (props.mode !== 'range' || !value || typeof value !== 'object' || Array.isArray(value)) {
    return { start: null, end: null }
  }
  const range = value as { start?: unknown; end?: unknown }
  const start = codec.toISO(range.start)
  const end = codec.toISO(range.end)
  if (start && end) {
    const [first, last] = orderedPair(start, end)
    return { start: first, end: last }
  }
  return { start, end }
})

const hasSelection = computed(
  () =>
    !!selectedSingle.value ||
    selectedMultiple.value.length > 0 ||
    !!selectedRange.value.start ||
    !!selectedRange.value.end,
)

// --- Visible month / view -------------------------------------------------------------------

const today = ref(todayISO())

// Today, pulled into [min, max] so an out-of-range "today" never opens on a month with no choices.
const clampedToday = computed(() => {
  if (minISO.value && compareISO(today.value, minISO.value) < 0) return minISO.value
  if (maxISO.value && compareISO(today.value, maxISO.value) > 0) return maxISO.value
  return today.value
})

const firstVisibleDate = () =>
  parseISODate(
    codec.toISO(props.viewDate) ??
      selectedSingle.value ??
      selectedMultiple.value[0] ??
      selectedRange.value.start ??
      clampedToday.value,
  )!

const initial = firstVisibleDate()
const viewYear = ref(initial.year)
const viewMonth = ref(initial.month)
const yearsStart = ref(initial.year - (initial.year % 12))
const view = ref<CalendarView>('days')
const hoverISO = ref<string | null>(null)
const focusedISO = ref<string | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const rootRef = ref<HTMLElement | null>(null)

const monthKey = computed(
  () => `${String(viewYear.value).padStart(4, '0')}-${String(viewMonth.value).padStart(2, '0')}`,
)

const setView = (year: number, month: number) => {
  viewYear.value = year
  viewMonth.value = month
}

const showView = (next: CalendarView) => {
  if (next === 'years') yearsStart.value = viewYear.value - (viewYear.value % 12)
  view.value = next
}

watch(view, (next) => emit('view-change', next))

watch([viewYear, viewMonth], ([year, month]) => emit('month-change', { year, month }))

watch(
  () => codec.toISO(props.viewDate),
  (iso) => {
    const date = parseISODate(iso)
    if (date) setView(date.year, date.month)
  },
)

// A date picked from outside (typed in a field, set by the form) brings its month into view.
watch(
  () => selectedSingle.value ?? selectedRange.value.start,
  (iso) => {
    const date = parseISODate(iso)
    if (date && iso!.slice(0, 7) !== monthKey.value) setView(date.year, date.month)
  },
)

const monthNames = computed(() => getMonthNames(props.locale))
const shortMonthNames = computed(() => getMonthNames(props.locale, 'short'))
const weekdayLabels = computed(() =>
  getWeekdayNames(props.locale, props.firstDayOfWeek, props.weekdayFormat),
)
const weekdayFullNames = computed(() => getWeekdayNames(props.locale, props.firstDayOfWeek, 'long'))

const yearLabel = computed(() => formatYear(viewYear.value, props.locale))

// --- Navigation -----------------------------------------------------------------------------

const firstOfMonth = (year: number, month: number) => toISO({ year, month, day: 1 })
const lastOfMonth = (year: number, month: number) =>
  toISO({ year, month, day: daysInMonth(year, month) })
const firstOfYear = (year: number) => firstOfMonth(year, 1)
const lastOfYear = (year: number) => lastOfMonth(year, 12)

const canGoPrevious = computed(() => {
  if (!minISO.value) return true
  const end =
    view.value === 'days'
      ? addDays(firstOfMonth(viewYear.value, viewMonth.value), -1)
      : view.value === 'months'
        ? lastOfYear(viewYear.value - 1)
        : lastOfYear(yearsStart.value - 1)
  return compareISO(end, minISO.value) >= 0
})

const canGoNext = computed(() => {
  if (!maxISO.value) return true
  const start =
    view.value === 'days'
      ? addDays(lastOfMonth(viewYear.value, viewMonth.value), 1)
      : view.value === 'months'
        ? firstOfYear(viewYear.value + 1)
        : firstOfYear(yearsStart.value + 12)
  return compareISO(start, maxISO.value) <= 0
})

const navigate = (direction: -1 | 1) => {
  if (direction < 0 ? !canGoPrevious.value : !canGoNext.value) return

  if (view.value === 'days') {
    const index = viewYear.value * 12 + (viewMonth.value - 1) + direction
    setView(Math.floor(index / 12), (index % 12) + 1)
  } else if (view.value === 'months') {
    viewYear.value += direction
  } else {
    yearsStart.value += 12 * direction
  }
}

const previousLabel = computed(() =>
  view.value === 'days'
    ? labels.value.previousMonth
    : view.value === 'months'
      ? labels.value.previousYear
      : labels.value.previousYears,
)
const nextLabel = computed(() =>
  view.value === 'days'
    ? labels.value.nextMonth
    : view.value === 'months'
      ? labels.value.nextYear
      : labels.value.nextYears,
)

const yearsRange = computed(() =>
  Array.from({ length: 12 }, (_, index) => yearsStart.value + index),
)

const isMonthUnavailable = (month: number) =>
  (!!minISO.value && compareISO(lastOfMonth(viewYear.value, month), minISO.value) < 0) ||
  (!!maxISO.value && compareISO(firstOfMonth(viewYear.value, month), maxISO.value) > 0)

const isYearUnavailable = (year: number) =>
  (!!minISO.value && compareISO(lastOfYear(year), minISO.value) < 0) ||
  (!!maxISO.value && compareISO(firstOfYear(year), maxISO.value) > 0)

const chooseMonth = (month: number) => {
  if (isMonthUnavailable(month)) return
  viewMonth.value = month
  showView('days')
}

const chooseYear = (year: number) => {
  if (isYearUnavailable(year)) return
  viewYear.value = year
  showView('months')
}

// --- Day cells ------------------------------------------------------------------------------

// While a range has its first end only, the hovered day previews the other end.
const rangeBounds = computed<[string, string] | null>(() => {
  if (props.mode !== 'range') return null
  const { start, end } = selectedRange.value
  if (start && end) return [start, end]
  if (start && hoverISO.value) return orderedPair(start, hoverISO.value)
  return null
})

interface DayCell extends CalendarCell {
  visible: boolean
  selected: boolean
  disabled: boolean
  today: boolean
  inRange: boolean
  rangeStart: boolean
  rangeEnd: boolean
  preview: boolean
  label: string
}

const toDayCell = (cell: CalendarCell): DayCell => {
  const bounds = rangeBounds.value
  const { start, end } = selectedRange.value
  const isRangeEdge = props.mode === 'range' && (cell.iso === start || cell.iso === end)

  let selected = false
  if (props.mode === 'single') selected = cell.iso === selectedSingle.value
  else if (props.mode === 'multiple') selected = selectedMultiple.value.includes(cell.iso)
  else selected = isRangeEdge

  const hasBand = !!bounds && bounds[0] !== bounds[1]

  return {
    ...cell,
    visible: !cell.outside || props.showOutsideDays,
    selected,
    disabled: props.disabled || isUnavailable(cell.iso),
    today: props.highlightToday && cell.iso === today.value,
    inRange:
      hasBand && compareISO(cell.iso, bounds![0]) > 0 && compareISO(cell.iso, bounds![1]) < 0,
    rangeStart: hasBand && cell.iso === bounds![0],
    rangeEnd: hasBand && cell.iso === bounds![1],
    preview: !end && !!start && !!hoverISO.value,
    label: formatLongDate(cell.iso, props.locale),
  }
}

const rows = computed(() =>
  buildMonthGrid(viewYear.value, viewMonth.value, props.firstDayOfWeek, props.fixedWeeks).map(
    (week) => ({
      weekNumber: getISOWeek(week[3].iso),
      cells: week.map(toDayCell),
    }),
  ),
)

const firstOfViewMonth = computed(() => firstOfMonth(viewYear.value, viewMonth.value))

// The one day that is in the tab order (roving tabindex).
const tabbableISO = computed(() => {
  const inView = (iso: string | null | undefined): iso is string =>
    !!iso && iso.slice(0, 7) === monthKey.value

  if (inView(focusedISO.value)) return focusedISO.value
  const selected = [
    selectedSingle.value,
    ...selectedMultiple.value,
    selectedRange.value.start,
    selectedRange.value.end,
  ].find(inView)
  if (selected) return selected
  if (inView(today.value)) return today.value
  return firstOfViewMonth.value
})

const cellClasses = (cell: DayCell) => ({
  'base-calendar__cell': true,
  'base-calendar__cell--in-range': cell.inRange,
  'base-calendar__cell--range-start': cell.rangeStart,
  'base-calendar__cell--range-end': cell.rangeEnd,
})

const dayClasses = (cell: DayCell) => ({
  'base-calendar__day': true,
  'base-calendar__day--selected': cell.selected,
  'base-calendar__day--today': cell.today,
  'base-calendar__day--disabled': cell.disabled,
  'base-calendar__day--outside': cell.outside,
  'base-calendar__day--in-range': cell.inRange,
  'base-calendar__day--preview': cell.preview && (cell.inRange || cell.rangeStart || cell.rangeEnd),
})

const daySlotProps = (cell: DayCell) => ({
  iso: cell.iso,
  year: cell.year,
  month: cell.month,
  day: cell.day,
  weekday: cell.weekday,
  isSelected: cell.selected,
  isDisabled: cell.disabled,
  isToday: cell.iso === today.value,
  isOutside: cell.outside,
  inRange: cell.inRange || cell.rangeStart || cell.rangeEnd,
})

// --- Selecting ------------------------------------------------------------------------------

const hasDisabledBetween = (from: string, to: string): boolean => {
  for (let current = addDays(from, 1); compareISO(current, to) < 0; current = addDays(current, 1)) {
    if (isUnavailable(current)) return true
  }
  return false
}

const isRangeAllowed = (from: string, to: string): boolean => {
  const length = diffInDays(from, to) + 1
  if (props.minRange && length < props.minRange) return false
  if (props.maxRange && length > props.maxRange) return false
  return !hasDisabledBetween(from, to)
}

const rangePayload = (start: string | null, end: string | null): CalendarRangePayload => ({
  start: start ? codec.payload(start) : null,
  end: end ? codec.payload(end) : null,
})

const emitRange = (start: string | null, end: string | null) => {
  emit('update:modelValue', {
    start: start ? codec.fromISO(start) : null,
    end: end ? codec.fromISO(end) : null,
  } as CalendarValue)
  emit('select', rangePayload(start, end))
}

const selectDate = (cell: CalendarCell) => {
  if (props.disabled || props.readonly || isUnavailable(cell.iso)) return
  const { iso } = cell

  if (props.mode === 'single') {
    emit('update:modelValue', codec.fromISO(iso) as CalendarValue)
    emit('select', codec.payload(iso))
  } else if (props.mode === 'multiple') {
    const current = selectedMultiple.value
    const isSelected = current.includes(iso)
    if (!isSelected && props.maxSelections && current.length >= props.maxSelections) return

    const next = isSelected ? current.filter((value) => value !== iso) : [...current, iso].sort()
    emit('update:modelValue', next.map((value) => codec.fromISO(value)) as CalendarValue)
    emit('select', codec.payload(iso))
  } else {
    const { start, end } = selectedRange.value
    if (start && !end) {
      const [from, to] = orderedPair(start, iso)
      // A second click that cannot close the range starts a new one instead of being ignored.
      if (isRangeAllowed(from, to)) emitRange(from, to)
      else emitRange(iso, null)
    } else {
      emitRange(iso, null)
    }
  }

  // An outside day belongs to a month that is not on screen.
  if (cell.outside) setView(cell.year, cell.month)
}

const clearSelection = () => {
  if (props.disabled || props.readonly) return
  if (props.mode === 'multiple') emit('update:modelValue', [])
  else if (props.mode === 'range') emit('update:modelValue', { start: null, end: null })
  else emit('update:modelValue', null)
}

const goToToday = () => {
  const date = parseISODate(clampedToday.value)!
  setView(date.year, date.month)
  showView('days')
}

const handleToday = () => {
  goToToday()
  if (props.mode === 'single' && !isUnavailable(today.value)) {
    const date = parseISODate(today.value)!
    selectDate({ iso: today.value, ...date, weekday: weekdayOf(date), outside: false })
  }
}

// --- Keyboard and focus ---------------------------------------------------------------------

const focusDay = (iso: string) => {
  nextTick(() => {
    gridRef.value?.querySelector<HTMLElement>(`[data-date="${iso}"]`)?.focus()
  })
}

const moveFocus = (target: string) => {
  let iso = target
  if (minISO.value && compareISO(iso, minISO.value) < 0) iso = minISO.value
  if (maxISO.value && compareISO(iso, maxISO.value) > 0) iso = maxISO.value

  const date = parseISODate(iso)!
  setView(date.year, date.month)
  focusedISO.value = iso
  focusDay(iso)
}

const handleGridKeydown = (event: KeyboardEvent) => {
  const iso = (event.target as HTMLElement | null)?.dataset?.date
  if (!iso) return

  // Position of the day inside its week row.
  const dayOfWeek = (weekdayOf(parseISODate(iso)!) - props.firstDayOfWeek + 7) % 7
  let target: string | null = null

  switch (event.key) {
    case 'ArrowLeft':
      target = addDays(iso, -1)
      break
    case 'ArrowRight':
      target = addDays(iso, 1)
      break
    case 'ArrowUp':
      target = addDays(iso, -7)
      break
    case 'ArrowDown':
      target = addDays(iso, 7)
      break
    case 'Home':
      target = addDays(iso, -dayOfWeek)
      break
    case 'End':
      target = addDays(iso, 6 - dayOfWeek)
      break
    case 'PageUp':
      target = addMonths(iso, event.shiftKey ? -12 : -1)
      break
    case 'PageDown':
      target = addMonths(iso, event.shiftKey ? 12 : 1)
      break
  }

  if (target) {
    event.preventDefault()
    moveFocus(target)
  }
}

// Escape closes the month/year pickers first; it never reaches an enclosing popup in that case.
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && view.value !== 'days') {
    event.stopPropagation()
    showView('days')
  }
}

const focus = () => {
  if (view.value === 'days') focusDay(tabbableISO.value)
  else rootRef.value?.querySelector<HTMLElement>('button:not(:disabled)')?.focus()
}

const goToDate = (value: unknown) => {
  const date = parseISODate(codec.toISO(value))
  if (!date) return
  setView(date.year, date.month)
  showView('days')
}

const api: CalendarApi = { goToDate, goToToday, focus }

onMounted(() => {
  // The page may have been open across midnight by the time the calendar is mounted again.
  today.value = todayISO()
  emit('mounted', api)
})

defineExpose(api)

const classes = computed(() => ({
  'vsui base-calendar': true,
  [`base-calendar--${props.size}`]: true,
  'base-calendar--disabled': props.disabled,
  'base-calendar--readonly': props.readonly,
  'base-calendar--block': props.block,
  'base-calendar--with-weeks': props.showWeekNumbers,
}))

const showFooter = computed(() => props.showTodayButton || props.showClearButton)
</script>

<template>
  <div ref="rootRef" :class="classes" :lang="locale" @keydown="handleKeydown">
    <div class="base-calendar__header">
      <button
        type="button"
        class="base-calendar__nav"
        :aria-label="previousLabel"
        :disabled="disabled || !canGoPrevious"
        @click="navigate(-1)"
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div class="base-calendar__title" aria-live="polite">
        <template v-if="view === 'years'">
          <span class="base-calendar__title-text">{{ yearsStart }} – {{ yearsStart + 11 }}</span>
        </template>
        <template v-else>
          <button
            v-if="view === 'days'"
            type="button"
            class="base-calendar__title-button base-calendar__month-button"
            :aria-label="`${labels.chooseMonth}: ${monthNames[viewMonth - 1]}`"
            :disabled="disabled"
            @click="showView('months')"
          >
            {{ monthNames[viewMonth - 1] }}
          </button>
          <button
            type="button"
            class="base-calendar__title-button base-calendar__year-button"
            :aria-label="`${labels.chooseYear}: ${yearLabel}`"
            :disabled="disabled"
            @click="showView('years')"
          >
            {{ yearLabel }}
          </button>
        </template>
      </div>

      <button
        type="button"
        class="base-calendar__nav"
        :aria-label="nextLabel"
        :disabled="disabled || !canGoNext"
        @click="navigate(1)"
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
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>

    <div
      v-if="view === 'days'"
      ref="gridRef"
      class="base-calendar__grid"
      role="grid"
      :aria-label="`${monthNames[viewMonth - 1]} ${yearLabel}`"
      :aria-multiselectable="mode !== 'single' || undefined"
      @keydown="handleGridKeydown"
      @mouseleave="hoverISO = null"
    >
      <div class="base-calendar__row base-calendar__row--head" role="row">
        <span
          v-if="showWeekNumbers"
          class="base-calendar__week-number"
          role="columnheader"
          :aria-label="labels.weekNumber"
          >#</span
        >
        <span
          v-for="(name, index) in weekdayLabels"
          :key="index"
          class="base-calendar__weekday"
          role="columnheader"
          :aria-label="weekdayFullNames[index]"
          >{{ name }}</span
        >
      </div>

      <div v-for="row in rows" :key="row.cells[0].iso" class="base-calendar__row" role="row">
        <span
          v-if="showWeekNumbers"
          class="base-calendar__week-number"
          role="rowheader"
          :aria-label="`${labels.weekNumber} ${row.weekNumber}`"
          >{{ row.weekNumber }}</span
        >

        <div
          v-for="cell in row.cells"
          :key="cell.iso"
          :class="cellClasses(cell)"
          role="gridcell"
          :aria-selected="cell.visible ? cell.selected : undefined"
          :aria-hidden="cell.visible ? undefined : true"
        >
          <button
            v-if="cell.visible"
            type="button"
            :class="dayClasses(cell)"
            :data-date="cell.iso"
            :tabindex="cell.iso === tabbableISO ? 0 : -1"
            :aria-label="cell.label"
            :aria-current="cell.today ? 'date' : undefined"
            :aria-disabled="cell.disabled || undefined"
            :disabled="disabled"
            @click="selectDate(cell)"
            @focus="focusedISO = cell.iso"
            @mouseenter="hoverISO = cell.iso"
          >
            <slot name="day" v-bind="daySlotProps(cell)">{{ cell.day }}</slot>
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="view === 'months'" class="base-calendar__picker base-calendar__months">
      <button
        v-for="(name, index) in shortMonthNames"
        :key="index"
        type="button"
        class="base-calendar__picker-item"
        :class="{
          'base-calendar__picker-item--selected': index + 1 === viewMonth,
          'base-calendar__picker-item--disabled': isMonthUnavailable(index + 1),
        }"
        :aria-label="monthNames[index]"
        :aria-disabled="isMonthUnavailable(index + 1) || undefined"
        :disabled="disabled"
        @click="chooseMonth(index + 1)"
      >
        {{ name }}
      </button>
    </div>

    <div v-else class="base-calendar__picker base-calendar__years">
      <button
        v-for="year in yearsRange"
        :key="year"
        type="button"
        class="base-calendar__picker-item"
        :class="{
          'base-calendar__picker-item--selected': year === viewYear,
          'base-calendar__picker-item--disabled': isYearUnavailable(year),
        }"
        :aria-disabled="isYearUnavailable(year) || undefined"
        :disabled="disabled"
        @click="chooseYear(year)"
      >
        {{ formatYear(year, locale) }}
      </button>
    </div>

    <div v-if="showFooter || $slots.footer" class="base-calendar__footer">
      <button
        v-if="showTodayButton"
        type="button"
        class="base-calendar__footer-button"
        :disabled="disabled || (mode === 'single' && !readonly && isUnavailable(today))"
        @click="handleToday"
      >
        {{ labels.today }}
      </button>
      <button
        v-if="showClearButton"
        type="button"
        class="base-calendar__footer-button"
        :disabled="disabled || readonly || !hasSelection"
        @click="clearSelection"
      >
        {{ labels.clear }}
      </button>
      <slot name="footer" />
    </div>
  </div>
</template>

<style lang="scss">
.base-calendar {
  --base-calendar-day: var(--vsui-calendar-day-size, 2.25rem);

  display: inline-block;
  box-sizing: border-box;
  padding: var(--vsui-calendar-padding, 0.75rem);
  border: 1px solid var(--vsui-calendar-border-color, var(--vsui-border-default, #e5e7eb));
  border-radius: var(--vsui-calendar-radius, 0.5rem);
  background-color: var(--vsui-calendar-bg, var(--vsui-bg-default, #ffffff));
  color: var(--vsui-calendar-text-color, var(--vsui-text-default, #111827));
  font-size: 0.875rem;
  user-select: none;

  &--small {
    --base-calendar-day: calc(var(--vsui-calendar-day-size, 2.25rem) * 0.85);
    font-size: 0.75rem;
  }

  &--large {
    --base-calendar-day: calc(var(--vsui-calendar-day-size, 2.25rem) * 1.2);
    font-size: 1rem;
  }

  &--block {
    display: block;
    width: 100%;
  }

  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  button {
    font: inherit;
    color: inherit;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 0.125rem;
    font-weight: 600;
    color: var(--vsui-calendar-header-color, var(--vsui-text-default, #111827));
  }

  &__title-text {
    padding: 0.25rem 0.5rem;
  }

  &__title-button {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: var(--vsui-calendar-day-radius, 0.375rem);
    background: transparent;
    font-weight: 600;
    cursor: pointer;

    &::first-letter {
      text-transform: uppercase;
    }

    &:hover:not(:disabled) {
      background-color: var(--vsui-calendar-day-hover-bg, var(--vsui-surface-hover, #f3f4f6));
    }
  }

  &__nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: none;
    border-radius: var(--vsui-calendar-day-radius, 0.375rem);
    background: transparent;
    color: var(--vsui-calendar-nav-color, var(--vsui-text-muted, #374151));
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: var(--vsui-calendar-day-hover-bg, var(--vsui-surface-hover, #f3f4f6));
    }

    &:disabled {
      color: var(--vsui-calendar-day-disabled-color, var(--vsui-text-disabled, #9ca3af));
      cursor: not-allowed;
    }
  }

  &__title-button:focus-visible,
  &__nav:focus-visible,
  &__day:focus-visible,
  &__picker-item:focus-visible,
  &__footer-button:focus-visible {
    outline: 2px solid var(--vsui-calendar-focus-ring, var(--vsui-color-primary, #3b82f6));
    outline-offset: 1px;
  }

  &__row {
    display: grid;
    grid-template-columns: repeat(7, var(--base-calendar-day));
  }

  &--with-weeks &__row {
    grid-template-columns: var(--base-calendar-day) repeat(7, var(--base-calendar-day));
  }

  &__weekday,
  &__week-number {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--base-calendar-day);
    font-size: 0.75em;
    font-weight: 500;
    color: var(--vsui-calendar-weekday-color, var(--vsui-text-subtle, #6b7280));
  }

  &__week-number {
    font-weight: 400;
  }

  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--base-calendar-day);

    &--in-range {
      background-color: var(--vsui-calendar-range-bg, var(--vsui-color-primary-light, #e0e7ff));
    }

    &--range-start {
      background: linear-gradient(
        to right,
        transparent 50%,
        var(--vsui-calendar-range-bg, var(--vsui-color-primary-light, #e0e7ff)) 50%
      );
    }

    &--range-end {
      background: linear-gradient(
        to left,
        transparent 50%,
        var(--vsui-calendar-range-bg, var(--vsui-color-primary-light, #e0e7ff)) 50%
      );
    }
  }

  &__day {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--base-calendar-day);
    height: var(--base-calendar-day);
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--vsui-calendar-day-radius, 0.375rem);
    background: transparent;
    cursor: pointer;
    font-variant-numeric: tabular-nums;

    &:hover:not(&--disabled):not(&--selected):not(:disabled) {
      background-color: var(--vsui-calendar-day-hover-bg, var(--vsui-surface-hover, #f3f4f6));
    }

    &--outside {
      color: var(--vsui-calendar-day-outside-color, var(--vsui-text-disabled, #9ca3af));
    }

    &--today {
      border-color: var(--vsui-calendar-today-color, var(--vsui-color-primary, #3b82f6));
      color: var(--vsui-calendar-today-color, var(--vsui-color-primary, #3b82f6));
      font-weight: 600;
    }

    &--in-range {
      border-radius: 0;
      color: var(--vsui-calendar-range-color, var(--vsui-color-primary-text, #1e40af));
    }

    &--selected {
      border-color: transparent;
      background-color: var(--vsui-calendar-selected-bg, var(--vsui-color-primary, #3b82f6));
      color: var(--vsui-calendar-selected-color, var(--vsui-text-inverse, #ffffff));
      font-weight: 600;
    }

    &--preview.base-calendar__day--selected {
      opacity: 0.85;
    }

    &--disabled {
      color: var(--vsui-calendar-day-disabled-color, var(--vsui-text-disabled, #9ca3af));
      text-decoration: line-through;
      cursor: not-allowed;
    }

    &--disabled.base-calendar__day--selected {
      opacity: 0.5;
    }
  }

  &--readonly &__day,
  &--disabled &__day {
    cursor: default;
  }

  &__picker {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
    // Same footprint as a six-week month, so switching views does not resize the calendar.
    width: calc(var(--base-calendar-day) * 7);
    min-height: calc(var(--base-calendar-day) * 7);
    align-content: start;
  }

  &--with-weeks &__picker {
    width: calc(var(--base-calendar-day) * 8);
  }

  &__picker-item {
    height: calc(var(--base-calendar-day) * 1.4);
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--vsui-calendar-day-radius, 0.375rem);
    background: transparent;
    cursor: pointer;

    &:hover:not(&--disabled):not(:disabled) {
      background-color: var(--vsui-calendar-day-hover-bg, var(--vsui-surface-hover, #f3f4f6));
    }

    &--selected {
      background-color: var(--vsui-calendar-selected-bg, var(--vsui-color-primary, #3b82f6));
      color: var(--vsui-calendar-selected-color, var(--vsui-text-inverse, #ffffff));
      font-weight: 600;

      &:hover:not(:disabled) {
        background-color: var(--vsui-calendar-selected-bg, var(--vsui-color-primary, #3b82f6));
      }
    }

    &--disabled {
      color: var(--vsui-calendar-day-disabled-color, var(--vsui-text-disabled, #9ca3af));
      cursor: not-allowed;
    }
  }

  &__footer {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--vsui-calendar-border-color, var(--vsui-border-default, #e5e7eb));
  }

  &__footer-button {
    padding: 0.25rem 0.75rem;
    border: none;
    border-radius: var(--vsui-calendar-day-radius, 0.375rem);
    background: transparent;
    color: var(--vsui-calendar-today-color, var(--vsui-color-primary, #3b82f6));
    font-weight: 500;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: var(--vsui-calendar-day-hover-bg, var(--vsui-surface-hover, #f3f4f6));
    }

    &:disabled {
      color: var(--vsui-calendar-day-disabled-color, var(--vsui-text-disabled, #9ca3af));
      cursor: not-allowed;
    }
  }
}
</style>
