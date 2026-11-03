import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import BaseCalendar from '../../src/components/BaseCalendar.vue'

type CalendarProps = InstanceType<typeof BaseCalendar>['$props']

enableAutoUnmount(afterEach)

beforeEach(() => {
  // "Today" is 3 November 2026 for every test. Only Date is faked, so promises keep working.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 3, 12, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

function mountCalendar(props: CalendarProps = {}, attach = false): VueWrapper {
  return mount(BaseCalendar, {
    props: { locale: 'en-US', ...props },
    attachTo: attach ? document.body : undefined,
  })
}

const day = (wrapper: VueWrapper, iso: string) =>
  wrapper.find<HTMLButtonElement>(`[data-date="${iso}"]`)

const emittedValues = (wrapper: VueWrapper, event = 'update:modelValue') =>
  (wrapper.emitted(event) ?? []).map((args) => args[0])

const monthDays = (wrapper: VueWrapper) =>
  wrapper.findAll('[data-date]:not(.base-calendar__day--outside)')

describe('BaseCalendar', () => {
  describe('rendering', () => {
    it('renders the base classes and opens on the month of today', () => {
      const wrapper = mountCalendar()

      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['vsui', 'base-calendar', 'base-calendar--medium']),
      )
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('November')
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2026')
      expect(monthDays(wrapper)).toHaveLength(30)
      expect(day(wrapper, '2026-11-03').classes()).toContain('base-calendar__day--today')
      expect(day(wrapper, '2026-11-03').attributes('aria-current')).toBe('date')
    })

    it('opens on the month of the selected date', () => {
      const wrapper = mountCalendar({ modelValue: '2024-02-14' })
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('February')
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2024')
      expect(monthDays(wrapper)).toHaveLength(29)
    })

    it('opens on viewDate when nothing is selected', () => {
      const wrapper = mountCalendar({ viewDate: '2027-05-01' })
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('May')
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2027')
    })

    it('uses grid roles and labels the days in full', () => {
      const wrapper = mountCalendar({ modelValue: '2026-11-03' })

      expect(wrapper.find('[role="grid"]').exists()).toBe(true)
      expect(day(wrapper, '2026-11-03').attributes('aria-label')).toBe('Tuesday, November 3, 2026')
      expect(
        day(wrapper, '2026-11-03')
          .element.closest('[role="gridcell"]')
          ?.getAttribute('aria-selected'),
      ).toBe('true')
      expect(
        day(wrapper, '2026-11-04')
          .element.closest('[role="gridcell"]')
          ?.getAttribute('aria-selected'),
      ).toBe('false')
    })

    it('names weekdays and months in the given locale', () => {
      const wrapper = mountCalendar({ locale: 'pt-BR' })
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('novembro')
      expect(wrapper.findAll('.base-calendar__weekday')[0].text().toLowerCase()).toContain('dom')
    })

    it('starts the week on firstDayOfWeek', () => {
      const wrapper = mountCalendar({ firstDayOfWeek: 1 })
      const names = wrapper.findAll('.base-calendar__weekday').map((cell) => cell.text())
      expect(names[0]).toBe('Mon')
      expect(names[6]).toBe('Sun')
      // 1 November 2026 is a Sunday, so it closes the first row
      expect(
        wrapper.findAll('.base-calendar__row')[1].findAll('[data-date]')[6].attributes('data-date'),
      ).toBe('2026-11-01')
    })

    it('shows week numbers when asked', () => {
      const wrapper = mountCalendar({ showWeekNumbers: true })
      expect(wrapper.findAll('[role="rowheader"]').length).toBeGreaterThanOrEqual(5)
      expect(wrapper.find('[role="rowheader"]').text()).toMatch(/^\d+$/)
    })

    it('can hide days of the neighbouring months', () => {
      const wrapper = mountCalendar({ showOutsideDays: false })
      expect(day(wrapper, '2026-10-31').exists()).toBe(false)
      expect(day(wrapper, '2026-11-15').exists()).toBe(true)
    })

    it('can always render six weeks', () => {
      const wrapper = mountCalendar({ fixedWeeks: true, viewDate: '2026-02-01' })
      expect(wrapper.findAll('[role="row"]')).toHaveLength(7) // header + 6 weeks
    })

    it('applies the size and block modifiers', () => {
      const wrapper = mountCalendar({ size: 'large', block: true })
      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['base-calendar--large', 'base-calendar--block']),
      )
    })

    it('renders the day slot', () => {
      const wrapper = mount(BaseCalendar, {
        props: { locale: 'en-US' },
        slots: {
          day: '<template #day="{ day, isToday }"><b>{{ day }}{{ isToday ? "!" : "" }}</b></template>',
        },
      })
      expect(day(wrapper, '2026-11-03').text()).toBe('3!')
      expect(day(wrapper, '2026-11-04').text()).toBe('4')
    })
  })

  describe('single selection', () => {
    it('emits the clicked date as YYYY-MM-DD and a select payload', async () => {
      const wrapper = mountCalendar()

      await day(wrapper, '2026-11-20').trigger('click')

      expect(emittedValues(wrapper)).toEqual(['2026-11-20'])
      expect(emittedValues(wrapper, 'select')).toEqual([
        {
          value: '2026-11-20',
          iso: '2026-11-20',
          year: 2026,
          month: 11,
          day: 20,
          formatted: '2026-11-20',
        },
      ])
    })

    it('marks the model value as selected', () => {
      const wrapper = mountCalendar({ modelValue: '2026-11-20' })
      expect(wrapper.findAll('.base-calendar__day--selected')).toHaveLength(1)
      expect(day(wrapper, '2026-11-20').classes()).toContain('base-calendar__day--selected')
    })

    it('ignores a model value that is not a date', () => {
      const wrapper = mountCalendar({ modelValue: '2026-02-31' })
      expect(wrapper.findAll('.base-calendar__day--selected')).toHaveLength(0)
    })

    it('selecting a day of the next month moves the view there', async () => {
      const wrapper = mountCalendar()
      await day(wrapper, '2026-12-02').trigger('click')

      expect(emittedValues(wrapper)).toEqual(['2026-12-02'])
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('December')
    })

    it('follows a model value that changes from outside', async () => {
      const wrapper = mountCalendar({ modelValue: '2026-11-20' })
      await wrapper.setProps({ modelValue: '2027-03-09' })
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('March')
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2027')
    })
  })

  describe('value format', () => {
    it('reads and writes the model with valueFormat', async () => {
      const wrapper = mountCalendar({ valueFormat: 'DD/MM/YYYY', modelValue: '03/11/2026' })
      expect(day(wrapper, '2026-11-03').classes()).toContain('base-calendar__day--selected')

      await day(wrapper, '2026-11-20').trigger('click')

      expect(emittedValues(wrapper)).toEqual(['20/11/2026'])
      expect(emittedValues(wrapper, 'select')[0]).toMatchObject({
        value: '20/11/2026',
        iso: '2026-11-20',
        formatted: '20/11/2026',
      })
    })

    it('supports a timestamp-like format without involving Date', async () => {
      const wrapper = mountCalendar({ valueFormat: 'YYYY-MM-DD[T00:00:00Z]' })
      await day(wrapper, '2026-11-20').trigger('click')
      expect(emittedValues(wrapper)).toEqual(['2026-11-20T00:00:00Z'])
    })

    it('reads min, max, viewDate and disabledDates in the same format', () => {
      const wrapper = mountCalendar({
        valueFormat: 'DD/MM/YYYY',
        min: '10/11/2026',
        max: '20/11/2026',
        disabledDates: ['15/11/2026'],
        viewDate: '01/11/2026',
      })
      expect(day(wrapper, '2026-11-09').attributes('aria-disabled')).toBe('true')
      expect(day(wrapper, '2026-11-10').attributes('aria-disabled')).toBeUndefined()
      expect(day(wrapper, '2026-11-15').attributes('aria-disabled')).toBe('true')
      expect(day(wrapper, '2026-11-21').attributes('aria-disabled')).toBe('true')
    })

    it('hands isDateDisabled the date in the model format', () => {
      const seen: unknown[] = []
      mountCalendar({
        valueFormat: 'YYYYMMDD',
        isDateDisabled: (value) => {
          seen.push(value)
          return false
        },
      })
      expect(seen).toContain('20261103')
    })

    it('lets serialize and parse replace the format', async () => {
      const wrapper = mountCalendar({
        modelValue: { d: '2026-11-05' } as unknown as string,
        serialize: (iso) => ({ d: iso }),
        parse: (value) => (value as { d?: string })?.d ?? null,
      })
      expect(day(wrapper, '2026-11-05').classes()).toContain('base-calendar__day--selected')

      await day(wrapper, '2026-11-06').trigger('click')
      expect(emittedValues(wrapper)).toEqual([{ d: '2026-11-06' }])
    })
  })

  describe('limits and disabled dates', () => {
    it('blocks days outside min and max (both inclusive)', async () => {
      const wrapper = mountCalendar({ min: '2026-11-05', max: '2026-11-25' })

      expect(day(wrapper, '2026-11-04').attributes('aria-disabled')).toBe('true')
      expect(day(wrapper, '2026-11-05').attributes('aria-disabled')).toBeUndefined()
      expect(day(wrapper, '2026-11-25').attributes('aria-disabled')).toBeUndefined()
      expect(day(wrapper, '2026-11-26').attributes('aria-disabled')).toBe('true')

      await day(wrapper, '2026-11-04').trigger('click')
      await day(wrapper, '2026-11-26').trigger('click')
      expect(emittedValues(wrapper)).toEqual([])

      await day(wrapper, '2026-11-05').trigger('click')
      expect(emittedValues(wrapper)).toEqual(['2026-11-05'])
    })

    it('does not navigate past the month of min and max', async () => {
      const wrapper = mountCalendar({ min: '2026-10-20', max: '2026-12-10' })
      const [previous, next] = wrapper.findAll('.base-calendar__nav')

      expect(previous.attributes('disabled')).toBeUndefined()
      await previous.trigger('click')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('October')
      expect(previous.attributes('disabled')).toBeDefined()

      await previous.trigger('click')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('October')

      await next.trigger('click')
      await next.trigger('click')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('December')
      expect(next.attributes('disabled')).toBeDefined()
    })

    it('opens on the closest allowed month when today is outside the limits', () => {
      const wrapper = mountCalendar({ min: '2027-02-01' })
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('February')
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2027')
    })

    it('blocks listed dates, ranges, weekdays and what the callback says', async () => {
      const wrapper = mountCalendar({
        disabledDates: ['2026-11-10', { start: '2026-11-15', end: '2026-11-17' }],
        disabledWeekdays: [0],
        isDateDisabled: (value) => value === '2026-11-20',
      })

      for (const iso of [
        '2026-11-10',
        '2026-11-15',
        '2026-11-16',
        '2026-11-17',
        '2026-11-08',
        '2026-11-20',
      ]) {
        expect(day(wrapper, iso).attributes('aria-disabled')).toBe('true')
        expect(day(wrapper, iso).classes()).toContain('base-calendar__day--disabled')
      }
      expect(day(wrapper, '2026-11-18').attributes('aria-disabled')).toBeUndefined()

      await day(wrapper, '2026-11-16').trigger('click')
      expect(emittedValues(wrapper)).toEqual([])
    })
  })

  describe('multiple selection', () => {
    it('toggles dates and keeps them sorted', async () => {
      const wrapper = mountCalendar({ mode: 'multiple', modelValue: ['2026-11-20'] })

      await day(wrapper, '2026-11-05').trigger('click')
      expect(emittedValues(wrapper)).toEqual([['2026-11-05', '2026-11-20']])

      await wrapper.setProps({ modelValue: ['2026-11-05', '2026-11-20'] })
      await day(wrapper, '2026-11-20').trigger('click')
      expect(emittedValues(wrapper)[1]).toEqual(['2026-11-05'])
    })

    it('respects maxSelections', async () => {
      const wrapper = mountCalendar({
        mode: 'multiple',
        maxSelections: 2,
        modelValue: ['2026-11-05', '2026-11-06'],
      })

      await day(wrapper, '2026-11-07').trigger('click')
      expect(emittedValues(wrapper)).toEqual([])

      await day(wrapper, '2026-11-06').trigger('click')
      expect(emittedValues(wrapper)).toEqual([['2026-11-05']])
    })

    it('uses valueFormat for every item', async () => {
      const wrapper = mountCalendar({
        mode: 'multiple',
        valueFormat: 'DD/MM/YYYY',
        modelValue: ['20/11/2026'],
      })
      await day(wrapper, '2026-11-05').trigger('click')
      expect(emittedValues(wrapper)).toEqual([['05/11/2026', '20/11/2026']])
    })
  })

  describe('range selection', () => {
    it('picks start, then end', async () => {
      const wrapper = mountCalendar({ mode: 'range', modelValue: { start: null, end: null } })

      await day(wrapper, '2026-11-10').trigger('click')
      expect(emittedValues(wrapper)[0]).toEqual({ start: '2026-11-10', end: null })

      await wrapper.setProps({ modelValue: { start: '2026-11-10', end: null } })
      await day(wrapper, '2026-11-14').trigger('click')
      expect(emittedValues(wrapper)[1]).toEqual({ start: '2026-11-10', end: '2026-11-14' })
    })

    it('puts the dates in order when the second click is earlier', async () => {
      const wrapper = mountCalendar({
        mode: 'range',
        modelValue: { start: '2026-11-14', end: null },
      })
      await day(wrapper, '2026-11-10').trigger('click')
      expect(emittedValues(wrapper)).toEqual([{ start: '2026-11-10', end: '2026-11-14' }])
    })

    it('starts over after a complete range', async () => {
      const wrapper = mountCalendar({
        mode: 'range',
        modelValue: { start: '2026-11-10', end: '2026-11-14' },
      })
      await day(wrapper, '2026-11-20').trigger('click')
      expect(emittedValues(wrapper)).toEqual([{ start: '2026-11-20', end: null }])
    })

    it('marks start, end and the days between', () => {
      const wrapper = mountCalendar({
        mode: 'range',
        modelValue: { start: '2026-11-10', end: '2026-11-13' },
      })
      expect(day(wrapper, '2026-11-10').classes()).toContain('base-calendar__day--selected')
      expect(day(wrapper, '2026-11-13').classes()).toContain('base-calendar__day--selected')
      expect(day(wrapper, '2026-11-11').classes()).toContain('base-calendar__day--in-range')
      expect(day(wrapper, '2026-11-12').classes()).toContain('base-calendar__day--in-range')
      expect(day(wrapper, '2026-11-14').classes()).not.toContain('base-calendar__day--in-range')
      expect(wrapper.findAll('.base-calendar__cell--range-start')).toHaveLength(1)
      expect(wrapper.findAll('.base-calendar__cell--range-end')).toHaveLength(1)
    })

    it('previews the range while hovering the second end', async () => {
      const wrapper = mountCalendar({
        mode: 'range',
        modelValue: { start: '2026-11-10', end: null },
      })
      await day(wrapper, '2026-11-13').trigger('mouseenter')
      expect(day(wrapper, '2026-11-11').classes()).toContain('base-calendar__day--in-range')
      expect(day(wrapper, '2026-11-14').classes()).not.toContain('base-calendar__day--in-range')
    })

    it('does not close a range over a disabled day, it starts a new one', async () => {
      const wrapper = mountCalendar({
        mode: 'range',
        disabledDates: ['2026-11-12'],
        modelValue: { start: '2026-11-10', end: null },
      })
      await day(wrapper, '2026-11-14').trigger('click')
      expect(emittedValues(wrapper)).toEqual([{ start: '2026-11-14', end: null }])
    })

    it('enforces minRange and maxRange, counting both ends', async () => {
      const wrapper = mountCalendar({
        mode: 'range',
        minRange: 3,
        maxRange: 5,
        modelValue: { start: '2026-11-10', end: null },
      })

      await day(wrapper, '2026-11-11').trigger('click') // 2 days: too short
      await day(wrapper, '2026-11-12').trigger('click') // 3 days: ok
      await day(wrapper, '2026-11-14').trigger('click') // 5 days: ok
      await day(wrapper, '2026-11-15').trigger('click') // 6 days: too long

      expect(emittedValues(wrapper)).toEqual([
        { start: '2026-11-11', end: null },
        { start: '2026-11-10', end: '2026-11-12' },
        { start: '2026-11-10', end: '2026-11-14' },
        { start: '2026-11-15', end: null },
      ])
    })

    it('emits both ends as payloads in select', async () => {
      const wrapper = mountCalendar({
        mode: 'range',
        valueFormat: 'DD/MM/YYYY',
        modelValue: { start: '10/11/2026', end: null },
      })
      await day(wrapper, '2026-11-14').trigger('click')
      expect(emittedValues(wrapper, 'select')[0]).toMatchObject({
        start: { iso: '2026-11-10', formatted: '10/11/2026' },
        end: { iso: '2026-11-14', formatted: '14/11/2026' },
      })
    })
  })

  describe('navigation', () => {
    it('moves between months and reports it', async () => {
      const wrapper = mountCalendar()
      const [previous, next] = wrapper.findAll('.base-calendar__nav')

      await next.trigger('click')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('December')
      expect(emittedValues(wrapper, 'month-change')).toEqual([{ year: 2026, month: 12 }])

      await next.trigger('click')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('January')
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2027')

      await previous.trigger('click')
      await previous.trigger('click')
      await previous.trigger('click')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('October')
    })

    it('picks a month from the month view', async () => {
      const wrapper = mountCalendar()

      await wrapper.find('.base-calendar__month-button').trigger('click')
      expect(wrapper.find('.base-calendar__months').exists()).toBe(true)
      expect(emittedValues(wrapper, 'view-change')).toEqual(['months'])

      const march = wrapper.findAll('.base-calendar__picker-item')[2]
      await march.trigger('click')

      expect(wrapper.find('.base-calendar__grid').exists()).toBe(true)
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('March')
    })

    it('picks a year from the year view', async () => {
      const wrapper = mountCalendar()

      await wrapper.find('.base-calendar__year-button').trigger('click')
      expect(wrapper.find('.base-calendar__years').exists()).toBe(true)
      expect(wrapper.findAll('.base-calendar__picker-item')).toHaveLength(12)

      const year2020 = wrapper
        .findAll('.base-calendar__picker-item')
        .find((item) => item.text() === '2020')!
      await year2020.trigger('click')

      // after a year comes the month, then the day
      expect(wrapper.find('.base-calendar__months').exists()).toBe(true)
      await wrapper.findAll('.base-calendar__picker-item')[0].trigger('click')
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2020')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('January')
    })

    it('does not offer months or years outside min and max', async () => {
      const wrapper = mountCalendar({ min: '2026-09-15', max: '2026-12-31' })

      await wrapper.find('.base-calendar__month-button').trigger('click')
      const items = wrapper.findAll('.base-calendar__picker-item')
      expect(items[7].attributes('aria-disabled')).toBe('true') // August
      expect(items[8].attributes('aria-disabled')).toBeUndefined() // September
      expect(items[11].attributes('aria-disabled')).toBeUndefined() // December

      await items[7].trigger('click')
      expect(wrapper.find('.base-calendar__months').exists()).toBe(true)
    })

    it('Escape leaves the month/year view first', async () => {
      const wrapper = mountCalendar()
      await wrapper.find('.base-calendar__month-button').trigger('click')

      await wrapper.find('.base-calendar__picker-item').trigger('keydown', { key: 'Escape' })
      expect(wrapper.find('.base-calendar__grid').exists()).toBe(true)
    })

    it('goToDate and goToToday are exposed', async () => {
      const wrapper = mountCalendar()
      const api = wrapper.emitted('mounted')![0][0] as {
        goToDate: (value: unknown) => void
        goToToday: () => void
      }

      api.goToDate('2030-06-15')
      await nextTick()
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('June')

      api.goToToday()
      await nextTick()
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('November')
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2026')
    })
  })

  describe('keyboard', () => {
    const press = async (
      wrapper: VueWrapper,
      from: string,
      key: string,
      init: KeyboardEventInit = {},
    ) => {
      day(wrapper, from).element.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
      )
      await nextTick()
      await nextTick()
    }

    it('keeps a single day in the tab order', () => {
      const wrapper = mountCalendar({ modelValue: '2026-11-20' })
      const tabbable = wrapper.findAll('[data-date][tabindex="0"]')
      expect(tabbable).toHaveLength(1)
      expect(tabbable[0].attributes('data-date')).toBe('2026-11-20')
    })

    it('moves with the arrow keys', async () => {
      const wrapper = mountCalendar({ modelValue: '2026-11-10' }, true)

      await press(wrapper, '2026-11-10', 'ArrowRight')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-11').element)

      await press(wrapper, '2026-11-11', 'ArrowDown')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-18').element)

      await press(wrapper, '2026-11-18', 'ArrowLeft')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-17').element)

      await press(wrapper, '2026-11-17', 'ArrowUp')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-10').element)
    })

    it('goes to the end of the week with End and the start with Home', async () => {
      const wrapper = mountCalendar({ modelValue: '2026-11-11' }, true) // Wednesday

      await press(wrapper, '2026-11-11', 'Home')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-08').element) // Sunday

      await press(wrapper, '2026-11-08', 'End')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-14').element) // Saturday
    })

    it('Home and End follow firstDayOfWeek', async () => {
      const wrapper = mountCalendar({ modelValue: '2026-11-11', firstDayOfWeek: 1 }, true)

      await press(wrapper, '2026-11-11', 'Home')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-09').element) // Monday

      await press(wrapper, '2026-11-09', 'End')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-15').element) // Sunday
    })

    it('crosses month boundaries and changes the visible month', async () => {
      const wrapper = mountCalendar({ modelValue: '2026-11-30' }, true)

      await press(wrapper, '2026-11-30', 'ArrowRight')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('December')
      expect(document.activeElement).toBe(day(wrapper, '2026-12-01').element)
    })

    it('PageUp/PageDown change the month, Shift the year, keeping the day', async () => {
      const wrapper = mountCalendar({ modelValue: '2026-01-31' }, true)

      await press(wrapper, '2026-01-31', 'PageDown')
      expect(document.activeElement).toBe(day(wrapper, '2026-02-28').element)

      await press(wrapper, '2026-02-28', 'PageUp')
      expect(document.activeElement).toBe(day(wrapper, '2026-01-28').element)

      await press(wrapper, '2026-01-28', 'PageDown', { shiftKey: true })
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2027')
      expect(document.activeElement).toBe(day(wrapper, '2027-01-28').element)
    })

    it('stops at min and max', async () => {
      const wrapper = mountCalendar(
        { modelValue: '2026-11-10', min: '2026-11-10', max: '2026-11-12' },
        true,
      )

      await press(wrapper, '2026-11-10', 'ArrowLeft')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-10').element)

      await press(wrapper, '2026-11-10', 'PageDown')
      expect(document.activeElement).toBe(day(wrapper, '2026-11-12').element)
    })
  })

  describe('footer buttons', () => {
    it('Today shows the month of today and selects it', async () => {
      const wrapper = mountCalendar({ showTodayButton: true, modelValue: '2024-02-14' })
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('February')

      await wrapper.findAll('.base-calendar__footer-button')[0].trigger('click')

      expect(emittedValues(wrapper)).toEqual(['2026-11-03'])
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('November')
    })

    it('Today is disabled in single mode when today cannot be picked', () => {
      const wrapper = mountCalendar({ showTodayButton: true, disabledDates: ['2026-11-03'] })
      expect(wrapper.find('.base-calendar__footer-button').attributes('disabled')).toBeDefined()
    })

    it('Today only navigates in range mode', async () => {
      const wrapper = mountCalendar({
        mode: 'range',
        showTodayButton: true,
        viewDate: '2024-02-01',
      })
      await wrapper.find('.base-calendar__footer-button').trigger('click')
      expect(emittedValues(wrapper)).toEqual([])
      expect(wrapper.find('.base-calendar__year-button').text()).toBe('2026')
    })

    it('Clear empties the selection for each mode', async () => {
      const single = mountCalendar({ showClearButton: true, modelValue: '2026-11-20' })
      await single.find('.base-calendar__footer-button').trigger('click')
      expect(emittedValues(single)).toEqual([null])

      const multiple = mountCalendar({
        showClearButton: true,
        mode: 'multiple',
        modelValue: ['2026-11-20'],
      })
      await multiple.find('.base-calendar__footer-button').trigger('click')
      expect(emittedValues(multiple)).toEqual([[]])

      const range = mountCalendar({
        showClearButton: true,
        mode: 'range',
        modelValue: { start: '2026-11-20', end: '2026-11-22' },
      })
      await range.find('.base-calendar__footer-button').trigger('click')
      expect(emittedValues(range)).toEqual([{ start: null, end: null }])
    })

    it('Clear is disabled while nothing is selected', () => {
      const wrapper = mountCalendar({ showClearButton: true })
      expect(wrapper.find('.base-calendar__footer-button').attributes('disabled')).toBeDefined()
    })

    it('uses the labels given', () => {
      const wrapper = mountCalendar({
        showTodayButton: true,
        showClearButton: true,
        labels: { today: 'Hoje', clear: 'Limpar', nextMonth: 'Próximo mês' },
      })
      const buttons = wrapper.findAll('.base-calendar__footer-button')
      expect(buttons[0].text()).toBe('Hoje')
      expect(buttons[1].text()).toBe('Limpar')
      expect(wrapper.findAll('.base-calendar__nav')[1].attributes('aria-label')).toBe('Próximo mês')
    })
  })

  describe('disabled and readonly', () => {
    it('does not select anything while disabled', async () => {
      const wrapper = mountCalendar({ disabled: true })
      expect(wrapper.classes()).toContain('base-calendar--disabled')
      await day(wrapper, '2026-11-20').trigger('click')
      expect(emittedValues(wrapper)).toEqual([])
    })

    it('can be browsed but not changed while readonly', async () => {
      const wrapper = mountCalendar({ readonly: true, modelValue: '2026-11-10' })
      await day(wrapper, '2026-11-20').trigger('click')
      expect(emittedValues(wrapper)).toEqual([])

      await wrapper.findAll('.base-calendar__nav')[1].trigger('click')
      expect(wrapper.find('.base-calendar__month-button').text()).toBe('December')
    })
  })

  describe('time zones', () => {
    it('never shifts a date, whatever the offset of the machine', async () => {
      // Late evening and early morning are where UTC conversion bugs show up.
      for (const [hour, minute] of [
        [0, 0],
        [0, 30],
        [23, 59],
      ]) {
        vi.setSystemTime(new Date(2026, 10, 3, hour, minute, 0))
        const wrapper = mountCalendar({ modelValue: '2026-11-03' })

        expect(day(wrapper, '2026-11-03').classes()).toContain('base-calendar__day--today')
        expect(day(wrapper, '2026-11-03').classes()).toContain('base-calendar__day--selected')

        await day(wrapper, '2026-11-04').trigger('click')
        expect(emittedValues(wrapper)).toEqual(['2026-11-04'])
        wrapper.unmount()
      }
    })
  })
})
