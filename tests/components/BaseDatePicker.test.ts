import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import BaseDatePicker from '../../src/components/BaseDatePicker.vue'

type DatePickerProps = InstanceType<typeof BaseDatePicker>['$props']

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 3, 12, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

function mountPicker(props: DatePickerProps = {}): VueWrapper {
  return mount(BaseDatePicker, {
    props: { locale: 'pt-BR', ...props },
    attachTo: document.body,
  })
}

const flush = async () => {
  await nextTick()
  await nextTick()
}

const input = (wrapper: VueWrapper) => wrapper.find<HTMLInputElement>('input')
const panel = () => document.body.querySelector<HTMLElement>('.base-date-picker__panel')
const dayButton = (iso: string) =>
  document.body.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)

const emittedValues = (wrapper: VueWrapper, event = 'update:modelValue') =>
  (wrapper.emitted(event) ?? []).map((args) => args[0])

const type = async (wrapper: VueWrapper, text: string) => {
  await input(wrapper).setValue(text)
  await flush()
}

const openPicker = async (wrapper: VueWrapper) => {
  await wrapper.find('.base-date-picker__toggle').trigger('click')
  await flush()
}

const clickDay = async (iso: string) => {
  dayButton(iso)!.click()
  await flush()
}

describe('BaseDatePicker', () => {
  describe('field', () => {
    it('renders the base classes, a label and a date field', () => {
      const wrapper = mountPicker({ label: 'Birthday' })

      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['vsui', 'base-date-picker', 'base-date-picker--default']),
      )
      expect(wrapper.find('label').text()).toContain('Birthday')
      expect(input(wrapper).exists()).toBe(true)
    })

    it('shows the placeholder in the order of the locale', () => {
      expect(input(mountPicker({ locale: 'pt-BR' })).attributes('placeholder')).toBe('DD/MM/YYYY')
      expect(input(mountPicker({ locale: 'en-US' })).attributes('placeholder')).toBe('MM/DD/YYYY')
      expect(input(mountPicker({ locale: 'ja-JP' })).attributes('placeholder')).toBe('YYYY/MM/DD')
      expect(input(mountPicker({ placeholder: 'Pick a day' })).attributes('placeholder')).toBe(
        'Pick a day',
      )
    })

    it('shows the model in the display format', () => {
      expect(input(mountPicker({ modelValue: '2026-11-03' })).element.value).toBe('03/11/2026')
      expect(input(mountPicker({ modelValue: '2026-11-03', locale: 'en-US' })).element.value).toBe(
        '11/03/2026',
      )
      expect(
        input(mountPicker({ modelValue: '2026-11-03', displayFormat: 'YYYY-MM-DD' })).element.value,
      ).toBe('2026-11-03')
    })

    it('keeps the value format apart from what the user sees', () => {
      const wrapper = mountPicker({ modelValue: '20261103', valueFormat: 'YYYYMMDD' })
      expect(input(wrapper).element.value).toBe('03/11/2026')
    })

    it('stays empty for a model that is not a date', () => {
      expect(input(mountPicker({ modelValue: '2026-02-31' })).element.value).toBe('')
      expect(input(mountPicker({ modelValue: null })).element.value).toBe('')
    })
  })

  describe('typing', () => {
    it('emits the date in the value format once it is complete', async () => {
      const wrapper = mountPicker({ valueFormat: 'DD/MM/YYYY' })

      await type(wrapper, '03112026')

      expect(emittedValues(wrapper)).toEqual(['03/11/2026'])
      expect(emittedValues(wrapper, 'change')).toEqual([
        {
          value: '03/11/2026',
          iso: '2026-11-03',
          year: 2026,
          month: 11,
          day: 3,
          formatted: '03/11/2026',
        },
      ])
    })

    it('emits YYYY-MM-DD by default', async () => {
      const wrapper = mountPicker()
      await type(wrapper, '03112026')
      expect(emittedValues(wrapper)).toEqual(['2026-11-03'])
    })

    it('types in the order of the display format', async () => {
      const wrapper = mountPicker({ locale: 'en-US' })
      await type(wrapper, '11032026')
      expect(emittedValues(wrapper)).toEqual(['2026-11-03'])
    })

    it('emits nothing while the date is incomplete', async () => {
      const wrapper = mountPicker()
      await type(wrapper, '0311')
      expect(emittedValues(wrapper)).toEqual([])
      expect(input(wrapper).element.value).toBe('03/11')
    })

    it('rejects a date that does not exist', async () => {
      const wrapper = mountPicker()

      await type(wrapper, '31022026')

      expect(emittedValues(wrapper)).toEqual([])
      expect(
        wrapper.find('.base-input__helper, .base-input__message, [class*="helper"]').text(),
      ).toContain('Invalid date')
      expect(wrapper.find('.base-input--error').exists()).toBe(true)
    })

    it('rejects a date outside min and max, or a disabled one', async () => {
      const wrapper = mountPicker({ min: '2026-11-10', disabledDates: ['2026-11-20'] })

      await type(wrapper, '05112026')
      expect(emittedValues(wrapper)).toEqual([])
      expect(wrapper.text()).toContain('Date not available')

      await type(wrapper, '20112026')
      expect(emittedValues(wrapper)).toEqual([])

      await type(wrapper, '12112026')
      expect(emittedValues(wrapper)).toEqual(['2026-11-12'])
      expect(wrapper.text()).not.toContain('Date not available')
    })

    it('uses custom labels for its messages', async () => {
      const wrapper = mountPicker({ labels: { invalidDate: 'Data inválida' } })
      await type(wrapper, '31022026')
      expect(wrapper.text()).toContain('Data inválida')
    })

    it('empties the model when the text is deleted', async () => {
      const wrapper = mountPicker({ modelValue: '2026-11-03' })

      await type(wrapper, '')

      expect(emittedValues(wrapper)).toEqual([null])
      expect(emittedValues(wrapper, 'change')).toEqual([null])
    })

    it('empties the model as soon as a full date becomes incomplete', async () => {
      const wrapper = mountPicker({ modelValue: '2026-11-03' })

      await type(wrapper, '0311202')

      expect(emittedValues(wrapper)).toEqual([null])
    })

    it('drops what was typed when the parent sets another value', async () => {
      const wrapper = mountPicker()
      await type(wrapper, '0311')

      await wrapper.setProps({ modelValue: '2027-01-02' })
      await flush()

      expect(input(wrapper).element.value).toBe('02/01/2027')
    })
  })

  describe('popover', () => {
    it('opens from the calendar button and renders the calendar in the body', async () => {
      const wrapper = mountPicker()
      expect(panel()).toBeNull()

      await openPicker(wrapper)

      expect(panel()).not.toBeNull()
      expect(panel()!.classList.contains('vsui')).toBe(true)
      expect(panel()!.hasAttribute('data-vsui-floating')).toBe(true)
      expect(panel()!.querySelector('.base-calendar')).not.toBeNull()
      expect(wrapper.find('.base-date-picker__toggle').attributes('aria-expanded')).toBe('true')
      expect(emittedValues(wrapper, 'update:open')).toEqual([true])
      expect(wrapper.emitted('open')).toHaveLength(1)
    })

    it('opens on the month of the current value', async () => {
      const wrapper = mountPicker({ modelValue: '2027-03-09' })
      await openPicker(wrapper)

      expect(dayButton('2027-03-09')).not.toBeNull()
      expect(dayButton('2027-03-09')!.classList.contains('base-calendar__day--selected')).toBe(true)
    })

    it('stays inside the field when teleport is off', async () => {
      const wrapper = mountPicker({ teleport: false })
      await openPicker(wrapper)

      expect(wrapper.find('.base-date-picker__panel').exists()).toBe(true)
      expect(wrapper.find('.base-date-picker__panel').classes()).not.toContain('vsui')
    })

    it('picks a date, emits it in the value format and closes', async () => {
      const wrapper = mountPicker({ valueFormat: 'DD/MM/YYYY' })
      await openPicker(wrapper)

      await clickDay('2026-11-20')

      expect(emittedValues(wrapper)).toEqual(['20/11/2026'])
      expect(emittedValues(wrapper, 'change')[0]).toMatchObject({
        iso: '2026-11-20',
        value: '20/11/2026',
      })
      expect(panel()).toBeNull()
      expect(emittedValues(wrapper, 'update:open')).toEqual([true, false])
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('can stay open after a pick', async () => {
      const wrapper = mountPicker({ closeOnSelect: false })
      await openPicker(wrapper)

      await clickDay('2026-11-20')

      expect(emittedValues(wrapper)).toEqual(['2026-11-20'])
      expect(panel()).not.toBeNull()
    })

    it('hands min, max and disabled dates to the calendar', async () => {
      const wrapper = mountPicker({ min: '2026-11-10', disabledWeekdays: [0] })
      await openPicker(wrapper)

      expect(dayButton('2026-11-09')!.getAttribute('aria-disabled')).toBe('true')
      expect(dayButton('2026-11-15')!.getAttribute('aria-disabled')).toBe('true') // Sunday
      expect(dayButton('2026-11-16')!.getAttribute('aria-disabled')).toBeNull()

      await clickDay('2026-11-09')
      expect(emittedValues(wrapper)).toEqual([])
      expect(panel()).not.toBeNull()
    })

    it('closes with Escape, without letting it reach anything else', async () => {
      const wrapper = mountPicker()
      await openPicker(wrapper)

      const outer = vi.fn()
      window.addEventListener('keydown', outer)
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      document.body.dispatchEvent(event)
      await flush()
      window.removeEventListener('keydown', outer)

      expect(panel()).toBeNull()
      expect(event.defaultPrevented).toBe(true)
      expect(outer).not.toHaveBeenCalled()
    })

    it('closes when the user clicks elsewhere', async () => {
      const wrapper = mountPicker()
      await openPicker(wrapper)

      document.body.click()
      await flush()

      expect(panel()).toBeNull()
    })

    it('does not close when the click is inside the calendar', async () => {
      const wrapper = mountPicker()
      await openPicker(wrapper)

      panel()!.querySelector<HTMLElement>('.base-calendar__header')!.click()
      await flush()

      expect(panel()).not.toBeNull()
    })

    it('does not close when the clicked button leaves the DOM during the click', async () => {
      // Opening the month picker removes the button that was clicked. In a browser Vue patches
      // between the button's handler and the document listener, so the target is detached by then.
      const wrapper = mountPicker()
      await openPicker(wrapper)

      // A node Vue knows nothing about, so removing it by hand cannot upset the renderer.
      const stray = document.createElement('button')
      panel()!.appendChild(stray)
      stray.addEventListener('click', () => stray.remove())
      stray.click()
      await flush()

      expect(panel()).not.toBeNull()
    })

    it('stays open while moving through the month and year pickers', async () => {
      const wrapper = mountPicker()
      await openPicker(wrapper)

      panel()!.querySelector<HTMLElement>('.base-calendar__month-button')!.click()
      await flush()
      expect(panel()!.querySelector('.base-calendar__months')).not.toBeNull()

      panel()!.querySelectorAll<HTMLElement>('.base-calendar__picker-item')[2].click()
      await flush()
      expect(panel()!.querySelector('.base-calendar__grid')).not.toBeNull()

      panel()!.querySelector<HTMLElement>('.base-calendar__year-button')!.click()
      await flush()
      expect(panel()!.querySelector('.base-calendar__years')).not.toBeNull()

      panel()!.querySelectorAll<HTMLElement>('.base-calendar__picker-item')[0].click()
      await flush()
      expect(panel()!.querySelector('.base-calendar__months')).not.toBeNull()
      expect(emittedValues(wrapper, 'update:open')).toEqual([true])
    })

    it('opens with ArrowDown on the field', async () => {
      const wrapper = mountPicker()
      await input(wrapper).trigger('keydown', { key: 'ArrowDown' })
      await flush()
      expect(panel()).not.toBeNull()
    })

    it('can be controlled with open', async () => {
      const wrapper = mountPicker({ open: false })
      await wrapper.setProps({ open: true })
      await flush()
      expect(panel()).not.toBeNull()

      await wrapper.setProps({ open: false })
      await flush()
      expect(panel()).toBeNull()
    })

    it('does not open while disabled or readonly', async () => {
      const disabled = mountPicker({ disabled: true })
      await disabled.find('.base-date-picker__toggle').trigger('click')
      await flush()
      expect(panel()).toBeNull()
      expect(disabled.find('.base-date-picker__toggle').attributes('disabled')).toBeDefined()

      const readonly = mountPicker({ readonly: true })
      await readonly.find('.base-date-picker__toggle').trigger('click')
      await flush()
      expect(panel()).toBeNull()
    })

    it('removes the popover with the component', async () => {
      const wrapper = mountPicker()
      await openPicker(wrapper)
      wrapper.unmount()
      expect(panel()).toBeNull()
    })
  })

  describe('clearable', () => {
    it('shows a clear button only when there is something to clear', async () => {
      const wrapper = mountPicker({ clearable: true })
      expect(wrapper.find('.base-date-picker__clear').exists()).toBe(false)

      await wrapper.setProps({ modelValue: '2026-11-03' })
      expect(wrapper.find('.base-date-picker__clear').exists()).toBe(true)
    })

    it('clears the model', async () => {
      const wrapper = mountPicker({ clearable: true, modelValue: '2026-11-03' })

      await wrapper.find('.base-date-picker__clear').trigger('click')

      expect(emittedValues(wrapper)).toEqual([null])
      expect(emittedValues(wrapper, 'change')).toEqual([null])
      expect(wrapper.emitted('clear')).toHaveLength(1)
    })
  })

  describe('range', () => {
    it('shows the range as read-only text', () => {
      const wrapper = mountPicker({
        mode: 'range',
        modelValue: { start: '2026-11-03', end: '2026-11-10' },
      })
      expect(input(wrapper).element.value).toBe('03/11/2026 – 10/11/2026')
      expect(input(wrapper).attributes('readonly')).toBeDefined()
      expect(input(wrapper).attributes('placeholder')).toBe('DD/MM/YYYY – DD/MM/YYYY')
    })

    it('opens when the field is clicked', async () => {
      const wrapper = mountPicker({ mode: 'range' })
      await input(wrapper).trigger('click')
      await flush()
      expect(panel()).not.toBeNull()
    })

    it('stays open until both ends are picked', async () => {
      const wrapper = mountPicker({ mode: 'range', valueFormat: 'DD/MM/YYYY' })
      await openPicker(wrapper)

      await clickDay('2026-11-10')
      expect(emittedValues(wrapper)[0]).toEqual({ start: '10/11/2026', end: null })
      expect(panel()).not.toBeNull()

      await wrapper.setProps({ modelValue: { start: '10/11/2026', end: null } })
      await clickDay('2026-11-14')

      expect(emittedValues(wrapper)[1]).toEqual({ start: '10/11/2026', end: '14/11/2026' })
      expect(emittedValues(wrapper, 'change')[1]).toMatchObject({
        start: { iso: '2026-11-10' },
        end: { iso: '2026-11-14' },
      })
      expect(panel()).toBeNull()
    })

    it('clears to an empty range', async () => {
      const wrapper = mountPicker({
        mode: 'range',
        clearable: true,
        modelValue: { start: '2026-11-03', end: '2026-11-10' },
      })
      await wrapper.find('.base-date-picker__clear').trigger('click')
      expect(emittedValues(wrapper)).toEqual([{ start: null, end: null }])
    })
  })

  describe('validation', () => {
    it('applies rules to the field', async () => {
      const wrapper = mountPicker({ rules: ['required'] })

      await input(wrapper).trigger('blur')
      await flush()

      expect(wrapper.find('.base-input--error').exists()).toBe(true)
    })

    it('validates again after a pick', async () => {
      // A parent that does what v-model does: feeds the emitted value back in.
      const wrapper: VueWrapper = mountPicker({
        rules: ['required'],
        'onUpdate:modelValue': (value: unknown) =>
          wrapper.setProps({ modelValue: value as string }),
      } as DatePickerProps)
      await input(wrapper).trigger('blur')
      await flush()
      expect(wrapper.find('.base-input--error').exists()).toBe(true)

      await openPicker(wrapper)
      await clickDay('2026-11-20')
      await flush()

      expect(wrapper.find('.base-input--error').exists()).toBe(false)
    })
  })
})
