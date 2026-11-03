import { describe, it, expect } from 'vitest'
import {
  addDays,
  addMonths,
  buildMonthGrid,
  compareISO,
  convertDateFormat,
  createDateCodec,
  daysInMonth,
  diffInDays,
  formatDate,
  getISOWeek,
  getMonthNames,
  getWeekdayNames,
  isDateUnavailable,
  isValidISODate,
  localeDateFormat,
  parseDate,
  parseISODate,
  todayISO,
  weekdayOf,
} from '../../src/composables/calendar'

describe('calendar utils: ISO dates', () => {
  it('parses only real calendar dates', () => {
    expect(parseISODate('2026-11-03')).toEqual({ year: 2026, month: 11, day: 3 })
    expect(parseISODate('2024-02-29')).not.toBeNull()
    expect(parseISODate('2026-02-29')).toBeNull()
    expect(parseISODate('2026-13-01')).toBeNull()
    expect(parseISODate('2026-00-10')).toBeNull()
    expect(parseISODate('2026-4-5')).toBeNull()
    expect(parseISODate('2026-11-03T00:00:00Z')).toBeNull()
    expect(parseISODate(20261103)).toBeNull()
    expect(isValidISODate('2026-04-31')).toBe(false)
  })

  it('knows month lengths, including leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(1900, 2)).toBe(28)
    expect(daysInMonth(2000, 2)).toBe(29)
    expect(daysInMonth(2026, 12)).toBe(31)
    expect(daysInMonth(2026, 4)).toBe(30)
  })

  it('computes the day of the week', () => {
    expect(weekdayOf({ year: 2026, month: 11, day: 3 })).toBe(2) // Tuesday
    expect(weekdayOf({ year: 2000, month: 1, day: 1 })).toBe(6) // Saturday
  })

  it('moves across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
    expect(addMonths('2026-03-10', 12)).toBe('2027-03-10')
  })

  it('compares and diffs without time zones', () => {
    expect(compareISO('2026-01-01', '2026-01-02')).toBe(-1)
    expect(compareISO('2026-01-01', '2026-01-01')).toBe(0)
    expect(diffInDays('2026-03-01', '2026-03-31')).toBe(30)
    // Across a daylight saving change in many zones.
    expect(diffInDays('2026-03-07', '2026-03-09')).toBe(2)
    expect(diffInDays('2026-11-01', '2026-11-03')).toBe(2)
    expect(diffInDays('2026-03-09', '2026-03-07')).toBe(-2)
  })

  it('reads today from the local calendar', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(todayISO()).toBe(expected)
  })

  it('numbers ISO weeks', () => {
    expect(getISOWeek('2026-01-01')).toBe(1)
    expect(getISOWeek('2021-01-01')).toBe(53)
    expect(getISOWeek('2024-12-30')).toBe(1)
    expect(getISOWeek('2026-11-03')).toBe(45)
  })
})

describe('calendar utils: value formats', () => {
  it('formats with tokens, padded and unpadded', () => {
    expect(formatDate('2026-11-03')).toBe('2026-11-03')
    expect(formatDate('2026-11-03', 'DD/MM/YYYY')).toBe('03/11/2026')
    expect(formatDate('2026-11-03', 'MM/DD/YYYY')).toBe('11/03/2026')
    expect(formatDate('2026-11-03', 'YYYYMMDD')).toBe('20261103')
    expect(formatDate('2026-11-03', 'D/M/YY')).toBe('3/11/26')
    expect(formatDate('2026-01-05', 'D/M/YYYY')).toBe('5/1/2026')
  })

  it('copies bracketed literals untouched', () => {
    expect(formatDate('2026-11-03', 'YYYY-MM-DD[T00:00:00Z]')).toBe('2026-11-03T00:00:00Z')
    expect(formatDate('2026-11-03', '[Day] D')).toBe('Day 3')
    expect(formatDate('2026-11-03', '[YYYY]')).toBe('YYYY')
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatDate('nope', 'DD/MM/YYYY')).toBe('')
    expect(formatDate('2026-02-30')).toBe('')
  })

  it('parses what it formats', () => {
    const formats = [
      'YYYY-MM-DD',
      'DD/MM/YYYY',
      'MM/DD/YYYY',
      'YYYYMMDD',
      'D/M/YYYY',
      'YYYY-MM-DD[T00:00:00Z]',
      'DD.MM.YYYY',
    ]
    for (const format of formats) {
      for (const iso of ['2026-11-03', '2024-02-29', '2026-01-05', '1999-12-31']) {
        expect(parseDate(formatDate(iso, format), format)).toBe(iso)
      }
    }
  })

  it('expands two-digit years to 20YY', () => {
    expect(parseDate('03/11/26', 'DD/MM/YY')).toBe('2026-11-03')
  })

  it('rejects text that does not fit the format or is not a real date', () => {
    expect(parseDate('31/04/2026', 'DD/MM/YYYY')).toBeNull()
    expect(parseDate('2026-11-03', 'DD/MM/YYYY')).toBeNull()
    expect(parseDate('3/11/2026', 'DD/MM/YYYY')).toBeNull()
    expect(parseDate('03/11/2026 ', 'DD/MM/YYYY')).toBeNull()
    expect(parseDate('', 'DD/MM/YYYY')).toBeNull()
    expect(parseDate(null)).toBeNull()
    // A format that cannot identify a whole date
    expect(parseDate('11/2026', 'MM/YYYY')).toBeNull()
  })

  it('converts between formats', () => {
    expect(convertDateFormat('03/11/2026', 'DD/MM/YYYY', 'YYYY-MM-DD')).toBe('2026-11-03')
    expect(convertDateFormat('20261103', 'YYYYMMDD', 'MM/DD/YYYY')).toBe('11/03/2026')
    expect(convertDateFormat('garbage', 'DD/MM/YYYY', 'YYYY-MM-DD')).toBe('')
  })
})

describe('calendar utils: date codec', () => {
  it('uses valueFormat in both directions', () => {
    const codec = createDateCodec(() => ({ valueFormat: 'DD/MM/YYYY' }))
    expect(codec.toISO('03/11/2026')).toBe('2026-11-03')
    expect(codec.fromISO('2026-11-03')).toBe('03/11/2026')
    expect(codec.toISO('2026-11-03')).toBeNull()
    expect(codec.toISO('')).toBeNull()
    expect(codec.toISO(null)).toBeNull()
  })

  it('lets serialize and parse take over', () => {
    const codec = createDateCodec(() => ({
      serialize: (iso) => ({ ts: iso }),
      parse: (value) => (value as { ts?: string })?.ts ?? null,
    }))
    expect(codec.fromISO('2026-11-03')).toEqual({ ts: '2026-11-03' })
    expect(codec.toISO({ ts: '2026-11-03' })).toBe('2026-11-03')
    expect(codec.toISO({ ts: 'garbage' })).toBeNull()
  })

  it('builds the select payload', () => {
    const codec = createDateCodec(() => ({ valueFormat: 'YYYYMMDD' }))
    expect(codec.payload('2026-11-03')).toEqual({
      value: '20261103',
      iso: '2026-11-03',
      year: 2026,
      month: 11,
      day: 3,
      formatted: '20261103',
    })
  })
})

describe('calendar utils: disabled dates', () => {
  it('applies limits, lists, ranges, weekdays and the callback', () => {
    const options = {
      min: '2026-11-05',
      max: '2026-11-25',
      disabledDates: ['2026-11-10', { start: '2026-11-15', end: '2026-11-17' }],
      disabledWeekdays: [0],
      isDateDisabled: (iso: string) => iso === '2026-11-20',
    }
    expect(isDateUnavailable('2026-11-04', options)).toBe(true) // before min
    expect(isDateUnavailable('2026-11-26', options)).toBe(true) // after max
    expect(isDateUnavailable('2026-11-05', options)).toBe(false) // min is inclusive
    expect(isDateUnavailable('2026-11-25', options)).toBe(false) // max is inclusive
    expect(isDateUnavailable('2026-11-10', options)).toBe(true)
    expect(isDateUnavailable('2026-11-15', options)).toBe(true)
    expect(isDateUnavailable('2026-11-16', options)).toBe(true)
    expect(isDateUnavailable('2026-11-17', options)).toBe(true)
    expect(isDateUnavailable('2026-11-18', options)).toBe(false)
    expect(isDateUnavailable('2026-11-08', options)).toBe(true) // Sunday
    expect(isDateUnavailable('2026-11-20', options)).toBe(true) // callback
    expect(isDateUnavailable('2026-11-12', options)).toBe(false)
  })
})

describe('calendar utils: grid', () => {
  it('lays out November 2026 starting on Sunday', () => {
    const grid = buildMonthGrid(2026, 11, 0)
    expect(grid).toHaveLength(5)
    expect(grid.every((week) => week.length === 7)).toBe(true)
    // 1 November 2026 is a Sunday
    expect(grid[0][0].iso).toBe('2026-11-01')
    expect(grid[0][0].outside).toBe(false)
    expect(grid[4][1].iso).toBe('2026-11-30')
    expect(grid[4][2].outside).toBe(true)
  })

  it('starts on Monday when asked', () => {
    const grid = buildMonthGrid(2026, 11, 1)
    expect(grid[0][0].iso).toBe('2026-10-26')
    expect(grid[0][0].outside).toBe(true)
    expect(grid[0][6].iso).toBe('2026-11-01')
    expect(grid[0].map((cell) => cell.weekday)).toEqual([1, 2, 3, 4, 5, 6, 0])
  })

  it('can always render six weeks', () => {
    expect(buildMonthGrid(2026, 2, 0, true)).toHaveLength(6)
    // February 2026 starts on a Sunday: exactly four weeks otherwise
    expect(buildMonthGrid(2026, 2, 0)).toHaveLength(4)
    expect(buildMonthGrid(2026, 8, 0)).toHaveLength(6)
  })

  it('crosses a year boundary', () => {
    const grid = buildMonthGrid(2026, 12, 0)
    const last = grid[grid.length - 1]
    expect(
      last[last.length - 1].iso.startsWith('2027-01') || last.some((c) => c.iso === '2026-12-31'),
    ).toBe(true)
  })
})

describe('calendar utils: locale', () => {
  it('names months and weekdays', () => {
    expect(getMonthNames('en-US')[10]).toBe('November')
    expect(getMonthNames('pt-BR')[10]).toBe('novembro')
    expect(getWeekdayNames('en-US', 0, 'short')[0]).toBe('Sun')
    expect(getWeekdayNames('en-US', 1, 'short')[0]).toBe('Mon')
    expect(getWeekdayNames('en-US', 1, 'short')[6]).toBe('Sun')
    expect(getWeekdayNames('en-US', 0, 'narrow')).toHaveLength(7)
  })

  it('falls back instead of throwing on an unknown locale', () => {
    expect(() => getMonthNames('not a locale!!')).not.toThrow()
  })

  it('maps a locale to a display format', () => {
    expect(localeDateFormat('pt-BR')).toBe('DD/MM/YYYY')
    expect(localeDateFormat('en-US')).toBe('MM/DD/YYYY')
    expect(localeDateFormat('ja-JP')).toBe('YYYY/MM/DD')
    expect(localeDateFormat('sv-SE')).toBe('YYYY-MM-DD')
  })
})
