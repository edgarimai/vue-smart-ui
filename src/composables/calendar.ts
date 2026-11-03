// Date utilities shared by BaseCalendar and BaseDatePicker.
//
// There is no time of day and no time zone anywhere in here: a date is a plain
// { year, month, day } triple (month 1-12), written as an ISO `YYYY-MM-DD` string internally.
// Week days and month lengths are computed on UTC dates, which have no DST, so the result never
// depends on where the code runs. The only "now" read is todayISO(), from the local calendar.

export interface CalendarDate {
  year: number
  /** 1-12 */
  month: number
  day: number
}

/** Anything the consumer passes in or gets back as a date (see `valueFormat`/`serialize`/`parse`). */
export type CalendarDateValue = string | number | Record<string, unknown>

export interface CalendarRangeValue {
  start: CalendarDateValue | null
  end: CalendarDateValue | null
}

export type CalendarMode = 'single' | 'multiple' | 'range'
export type CalendarSize = 'small' | 'medium' | 'large'
export type CalendarWeekdayFormat = 'narrow' | 'short' | 'long'
export type CalendarView = 'days' | 'months' | 'years'

/** Display formats the date mask of BaseInput can handle. */
export type DisplayDateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'YYYY/MM/DD'

export type CalendarValue = CalendarDateValue | CalendarDateValue[] | CalendarRangeValue | null

export type DisabledDateRule =
  | CalendarDateValue
  | { start: CalendarDateValue; end: CalendarDateValue }

export interface CalendarLabels {
  today: string
  clear: string
  previousMonth: string
  nextMonth: string
  previousYear: string
  nextYear: string
  previousYears: string
  nextYears: string
  chooseMonth: string
  chooseYear: string
  weekNumber: string
  openCalendar: string
  clearDate: string
  invalidDate: string
  dateUnavailable: string
}

export const DEFAULT_CALENDAR_LABELS: CalendarLabels = {
  today: 'Today',
  clear: 'Clear',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousYears: 'Previous years',
  nextYears: 'Next years',
  chooseMonth: 'Choose month',
  chooseYear: 'Choose year',
  weekNumber: 'Week',
  openCalendar: 'Open calendar',
  clearDate: 'Clear date',
  invalidDate: 'Invalid date',
  dateUnavailable: 'Date not available',
}

/** What `select`/`change` events carry for one date. */
export interface CalendarDatePayload {
  /** The date as the consumer's model holds it (`valueFormat`, or whatever `serialize` returns). */
  value: unknown
  /** Always `YYYY-MM-DD`. */
  iso: string
  year: number
  month: number
  day: number
  /** The date written with `valueFormat`, even when `serialize` returns something else. */
  formatted: string
}

export interface CalendarRangePayload {
  start: CalendarDatePayload | null
  end: CalendarDatePayload | null
}

export interface CalendarCell {
  iso: string
  year: number
  month: number
  day: number
  weekday: number
  /** Belongs to the previous/next month of the grid. */
  outside: boolean
}

/**
 * Props that BaseCalendar and BaseDatePicker share. Everything a consumer passes in
 * (`min`, `max`, `viewDate`, `disabledDates`, the argument of `isDateDisabled`) uses the same
 * representation as the model: `valueFormat`, or whatever `parse`/`serialize` agree on.
 */
export interface CalendarOptionProps {
  /** Tokens `YYYY YY MM M DD D` plus `[literal]` text. Default `YYYY-MM-DD`. */
  valueFormat?: string
  /** Replaces `valueFormat` when writing a date to the model (any shape). */
  serialize?: (iso: string) => unknown
  /** Replaces `valueFormat` when reading a date from the model; returns `YYYY-MM-DD` or null. */
  parse?: (value: any) => string | null | undefined // eslint-disable-line @typescript-eslint/no-explicit-any
  min?: CalendarDateValue | null
  max?: CalendarDateValue | null
  disabledDates?: DisabledDateRule[]
  /** 0 = Sunday ... 6 = Saturday */
  disabledWeekdays?: number[]
  isDateDisabled?: (value: any) => boolean // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Range mode: shortest/longest interval, counting both ends (a single day is 1). */
  minRange?: number
  maxRange?: number
  locale?: string
  /** 0 = Sunday ... 6 = Saturday */
  firstDayOfWeek?: number
  weekdayFormat?: CalendarWeekdayFormat
  /** Month shown first when there is no selection. */
  viewDate?: CalendarDateValue | null
  showOutsideDays?: boolean
  fixedWeeks?: boolean
  showWeekNumbers?: boolean
  highlightToday?: boolean
  showTodayButton?: boolean
  showClearButton?: boolean
  size?: CalendarSize
  labels?: Partial<CalendarLabels>
}

// Unset optional props (serialize, min, ...) are left out on purpose: undefined is their default.
export const CALENDAR_OPTION_DEFAULTS = {
  valueFormat: 'YYYY-MM-DD',
  disabledDates: () => [] as DisabledDateRule[],
  disabledWeekdays: () => [] as number[],
  locale: 'pt-BR',
  firstDayOfWeek: 0,
  weekdayFormat: 'short' as CalendarWeekdayFormat,
  showOutsideDays: true,
  fixedWeeks: false,
  showWeekNumbers: false,
  highlightToday: true,
  showTodayButton: false,
  showClearButton: false,
  size: 'medium' as CalendarSize,
  labels: () => ({}) as Partial<CalendarLabels>,
}

// --------------------------------------------------------------------------------------------
// ISO dates
// --------------------------------------------------------------------------------------------

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 86_400_000

// Date.UTC() maps years 0-99 to 1900-1999, so the year is set separately.
const utcDate = (year: number, month: number, day: number): Date => {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return date
}

const fromUTC = (date: Date): CalendarDate => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
})

const pad = (value: number, length = 2): string => String(value).padStart(length, '0')

export const daysInMonth = (year: number, month: number): number =>
  utcDate(year, month + 1, 0).getUTCDate()

export const isValidDate = (year: number, month: number, day: number): boolean =>
  Number.isInteger(year) &&
  Number.isInteger(month) &&
  Number.isInteger(day) &&
  year >= 1 &&
  year <= 9999 &&
  month >= 1 &&
  month <= 12 &&
  day >= 1 &&
  day <= daysInMonth(year, month)

export const toISO = (date: CalendarDate): string =>
  `${pad(date.year, 4)}-${pad(date.month)}-${pad(date.day)}`

export const parseISODate = (iso: unknown): CalendarDate | null => {
  if (typeof iso !== 'string') return null
  const match = ISO_PATTERN.exec(iso)
  if (!match) return null

  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  return isValidDate(date.year, date.month, date.day) ? date : null
}

export const isValidISODate = (iso: unknown): iso is string => parseISODate(iso) !== null

/** ISO strings have a fixed width, so plain string comparison orders them chronologically. */
export const compareISO = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

export const weekdayOf = (date: CalendarDate): number =>
  utcDate(date.year, date.month, date.day).getUTCDay()

export const addDays = (iso: string, amount: number): string => {
  const date = parseISODate(iso)
  if (!date) return iso
  const moved = utcDate(date.year, date.month, date.day)
  moved.setTime(moved.getTime() + amount * MS_PER_DAY)
  return toISO(fromUTC(moved))
}

/** Moves by whole months, clamping the day (Jan 31 + 1 month = Feb 28/29). */
export const addMonths = (iso: string, amount: number): string => {
  const date = parseISODate(iso)
  if (!date) return iso
  const index = date.year * 12 + (date.month - 1) + amount
  const year = Math.floor(index / 12)
  const month = (index % 12) + 1
  return toISO({ year, month, day: Math.min(date.day, daysInMonth(year, month)) })
}

/** Number of days from `a` to `b` (negative when `b` is earlier). */
export const diffInDays = (a: string, b: string): number => {
  const from = parseISODate(a)
  const to = parseISODate(b)
  if (!from || !to) return 0
  const delta =
    utcDate(to.year, to.month, to.day).getTime() -
    utcDate(from.year, from.month, from.day).getTime()
  return Math.round(delta / MS_PER_DAY)
}

/** Today in the local calendar, as `YYYY-MM-DD`. */
export const todayISO = (): string => {
  const now = new Date()
  return toISO({ year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() })
}

/** ISO 8601 week number (weeks start on Monday, week 1 contains the first Thursday). */
export const getISOWeek = (iso: string): number => {
  const date = parseISODate(iso)
  if (!date) return 0
  const thursday = utcDate(date.year, date.month, date.day)
  thursday.setUTCDate(thursday.getUTCDate() + 3 - ((thursday.getUTCDay() + 6) % 7))
  const firstThursday = utcDate(thursday.getUTCFullYear(), 1, 4)
  const offset = (firstThursday.getUTCDay() + 6) % 7
  return (
    1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / MS_PER_DAY - 3 + offset) / 7)
  )
}

// --------------------------------------------------------------------------------------------
// Value formats: `YYYY-MM-DD`, `DD/MM/YYYY`, `YYYYMMDD`, `YYYY-MM-DD[T00:00:00Z]`...
//
// Tokens: YYYY YY MM M DD D. Text between square brackets is copied as it is. Everything else is
// literal too. `YY` is read as 20YY.
// --------------------------------------------------------------------------------------------

export const DEFAULT_VALUE_FORMAT = 'YYYY-MM-DD'

const TOKEN_PATTERN = /\[([^\]]*)\]|YYYY|YY|MM|M|DD|D/g

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Writes an ISO date with `format`. Returns '' when `iso` is not a valid date. */
export const formatDate = (iso: string, format: string = DEFAULT_VALUE_FORMAT): string => {
  const date = parseISODate(iso)
  if (!date) return ''

  return format.replace(TOKEN_PATTERN, (token, literal?: string) => {
    if (literal !== undefined) return literal
    switch (token) {
      case 'YYYY':
        return pad(date.year, 4)
      case 'YY':
        return pad(date.year % 100)
      case 'MM':
        return pad(date.month)
      case 'M':
        return String(date.month)
      case 'DD':
        return pad(date.day)
      default:
        return String(date.day)
    }
  })
}

const parserCache = new Map<string, { regex: RegExp; tokens: string[] } | null>()

const compileFormat = (format: string): { regex: RegExp; tokens: string[] } | null => {
  const cached = parserCache.get(format)
  if (cached !== undefined) return cached

  const tokens: string[] = []
  let source = ''
  let cursor = 0

  for (const match of format.matchAll(TOKEN_PATTERN)) {
    source += escapeRegExp(format.slice(cursor, match.index))
    cursor = (match.index ?? 0) + match[0].length

    if (match[1] !== undefined) {
      source += escapeRegExp(match[1])
      continue
    }

    tokens.push(match[0])
    source +=
      match[0] === 'YYYY'
        ? '(\\d{4})'
        : match[0] === 'M' || match[0] === 'D'
          ? '(\\d{1,2})'
          : '(\\d{2})'
  }
  source += escapeRegExp(format.slice(cursor))

  // A format that cannot identify a whole date is useless for parsing.
  const hasYear = tokens.includes('YYYY') || tokens.includes('YY')
  const hasMonth = tokens.includes('MM') || tokens.includes('M')
  const hasDay = tokens.includes('DD') || tokens.includes('D')
  const compiled =
    hasYear && hasMonth && hasDay ? { regex: new RegExp(`^${source}$`), tokens } : null

  parserCache.set(format, compiled)
  return compiled
}

/** Reads a date written with `format` and returns it as `YYYY-MM-DD`, or null if it does not fit. */
export const parseDate = (text: unknown, format: string = DEFAULT_VALUE_FORMAT): string | null => {
  if (typeof text !== 'string') return null

  const compiled = compileFormat(format)
  const match = compiled?.regex.exec(text)
  if (!compiled || !match) return null

  let year = 0
  let month = 0
  let day = 0
  compiled.tokens.forEach((token, index) => {
    const value = Number(match[index + 1])
    if (token === 'YYYY') year = value
    else if (token === 'YY') year = 2000 + value
    else if (token === 'MM' || token === 'M') month = value
    else day = value
  })

  return isValidDate(year, month, day) ? toISO({ year, month, day }) : null
}

/** Rewrites a date from one format to another. Returns '' when `text` does not fit `from`. */
export const convertDateFormat = (text: string, from: string, to: string): string => {
  const iso = parseDate(text, from)
  return iso ? formatDate(iso, to) : ''
}

// --------------------------------------------------------------------------------------------
// Consumer value <-> ISO
// --------------------------------------------------------------------------------------------

export interface DateCodecOptions {
  valueFormat?: string
  serialize?: ((iso: string) => unknown) | null
  parse?: ((value: unknown) => string | null | undefined) | null
}

export interface DateCodec {
  /** The consumer's value as `YYYY-MM-DD`, or null when it is empty or invalid. */
  toISO: (value: unknown) => string | null
  /** An ISO date as the consumer's model holds it. */
  fromISO: (iso: string) => unknown
  payload: (iso: string) => CalendarDatePayload
}

/** The options are read through a getter so the codec follows reactive props. */
export const createDateCodec = (options: () => DateCodecOptions): DateCodec => {
  const format = () => options().valueFormat || DEFAULT_VALUE_FORMAT

  const toISOValue = (value: unknown): string | null => {
    if (value === null || value === undefined || value === '') return null
    const { parse } = options()
    const iso = parse ? parse(value) : parseDate(value, format())
    return isValidISODate(iso) ? iso : null
  }

  const fromISO = (iso: string): unknown => {
    const { serialize } = options()
    return serialize ? serialize(iso) : formatDate(iso, format())
  }

  const payload = (iso: string): CalendarDatePayload => {
    const date = parseISODate(iso) as CalendarDate
    return {
      value: fromISO(iso),
      iso,
      year: date.year,
      month: date.month,
      day: date.day,
      formatted: formatDate(iso, format()),
    }
  }

  return { toISO: toISOValue, fromISO, payload }
}

// --------------------------------------------------------------------------------------------
// Disabled dates
// --------------------------------------------------------------------------------------------

type DisabledIsoRule = string | { start: string; end: string }

export interface DisabledDateOptions {
  min?: string | null
  max?: string | null
  /** ISO dates, or `{ start, end }` ISO ranges (inclusive). */
  disabledDates?: DisabledIsoRule[]
  /** 0 = Sunday ... 6 = Saturday */
  disabledWeekdays?: number[]
  isDateDisabled?: ((iso: string) => boolean) | null
}

export const isDateUnavailable = (iso: string, options: DisabledDateOptions): boolean => {
  const { min, max, disabledDates, disabledWeekdays, isDateDisabled } = options

  if (min && compareISO(iso, min) < 0) return true
  if (max && compareISO(iso, max) > 0) return true

  if (disabledWeekdays?.length) {
    const date = parseISODate(iso)
    if (date && disabledWeekdays.includes(weekdayOf(date))) return true
  }

  if (disabledDates?.length) {
    const blocked = disabledDates.some((rule) =>
      typeof rule === 'string'
        ? rule === iso
        : compareISO(iso, rule.start) >= 0 && compareISO(iso, rule.end) <= 0,
    )
    if (blocked) return true
  }

  return !!isDateDisabled?.(iso)
}

/** Turns the consumer-facing limit props into the ISO options `isDateUnavailable` works on. */
export const resolveDisabledOptions = (
  props: Pick<
    CalendarOptionProps,
    'min' | 'max' | 'disabledDates' | 'disabledWeekdays' | 'isDateDisabled'
  >,
  codec: DateCodec,
): DisabledDateOptions => ({
  min: codec.toISO(props.min),
  max: codec.toISO(props.max),
  disabledDates: (props.disabledDates ?? []).flatMap((rule): DisabledIsoRule[] => {
    if (rule && typeof rule === 'object' && 'start' in rule && 'end' in rule) {
      const start = codec.toISO(rule.start)
      const end = codec.toISO(rule.end)
      return start && end ? [{ start, end }] : []
    }
    const iso = codec.toISO(rule)
    return iso ? [iso] : []
  }),
  disabledWeekdays: props.disabledWeekdays,
  isDateDisabled: props.isDateDisabled
    ? (iso: string) => props.isDateDisabled!(codec.fromISO(iso))
    : null,
})

// --------------------------------------------------------------------------------------------
// Grid
// --------------------------------------------------------------------------------------------

const toCell = (iso: string, month: number): CalendarCell => {
  const date = parseISODate(iso) as CalendarDate
  return { iso, ...date, weekday: weekdayOf(date), outside: date.month !== month }
}

/** Weeks of a month as rows of 7 cells, starting on `firstDayOfWeek` (0 = Sunday). */
export const buildMonthGrid = (
  year: number,
  month: number,
  firstDayOfWeek = 0,
  fixedWeeks = false,
): CalendarCell[][] => {
  const first = { year, month, day: 1 }
  const offset = (weekdayOf(first) - firstDayOfWeek + 7) % 7
  const weekCount = fixedWeeks ? 6 : Math.ceil((offset + daysInMonth(year, month)) / 7)
  const start = addDays(toISO(first), -offset)

  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => toCell(addDays(start, week * 7 + day), month)),
  )
}

// --------------------------------------------------------------------------------------------
// Locale
// --------------------------------------------------------------------------------------------

const formatterCache = new Map<string, Intl.DateTimeFormat>()

const getFormatter = (locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  const key = `${locale}|${JSON.stringify(options)}`
  let formatter = formatterCache.get(key)
  if (!formatter) {
    try {
      formatter = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
    } catch {
      // Unknown locale tag: fall back instead of breaking the whole component.
      formatter = new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' })
    }
    formatterCache.set(key, formatter)
  }
  return formatter
}

export const getMonthNames = (locale: string, format: 'long' | 'short' = 'long'): string[] =>
  Array.from({ length: 12 }, (_, index) =>
    getFormatter(locale, { month: format }).format(utcDate(2024, index + 1, 1)),
  )

/** Weekday names in grid order, starting on `firstDayOfWeek`. */
export const getWeekdayNames = (
  locale: string,
  firstDayOfWeek = 0,
  format: CalendarWeekdayFormat = 'short',
): string[] =>
  Array.from({ length: 7 }, (_, index) =>
    // 2023-01-01 is a Sunday.
    getFormatter(locale, { weekday: format }).format(
      utcDate(2023, 1, 1 + ((firstDayOfWeek + index) % 7)),
    ),
  )

export const formatYear = (year: number, locale: string): string =>
  getFormatter(locale, { year: 'numeric' }).format(utcDate(year, 1, 1))

/** Full date for screen readers, e.g. "Tuesday, November 3, 2026". */
export const formatLongDate = (iso: string, locale: string): string => {
  const date = parseISODate(iso)
  return date
    ? getFormatter(locale, { dateStyle: 'full' }).format(utcDate(date.year, date.month, date.day))
    : ''
}

/** The mask-friendly display format that matches how `locale` orders day, month and year. */
export const localeDateFormat = (locale: string): DisplayDateFormat => {
  const parts = getFormatter(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(utcDate(2000, 12, 25))
  const order = parts
    .filter((part) => ['day', 'month', 'year'].includes(part.type))
    .map((part) => part.type)
  const separator = parts.find((part) => part.type === 'literal')?.value.trim() ?? '/'

  if (order[0] === 'year') return separator === '/' ? 'YYYY/MM/DD' : 'YYYY-MM-DD'
  if (order[0] === 'month') return 'MM/DD/YYYY'
  return 'DD/MM/YYYY'
}
