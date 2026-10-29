import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import BaseSlider from '../../src/components/BaseSlider.vue'

type SliderProps = InstanceType<typeof BaseSlider>['$props']

const TRACK_WIDTH = 100

function mountSlider(props: SliderProps = {}, attachToBody = false) {
  return mount(BaseSlider, {
    props,
    attachTo: attachToBody ? document.body : undefined,
  })
}

function lastEmitted(wrapper: VueWrapper, event: string): unknown {
  const calls = wrapper.emitted(event)
  if (!calls || calls.length === 0) return undefined
  return calls[calls.length - 1][0]
}

function emittedValues(wrapper: VueWrapper, event: string): unknown[] {
  return (wrapper.emitted(event) ?? []).map((args) => args[0])
}

function touchEvent(type: string, clientX: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: [{ clientX }] })
  return event
}

function mouseOnDocument(type: 'mousemove' | 'mouseup', clientX = 0): void {
  document.dispatchEvent(new MouseEvent(type, { clientX, bubbles: true }))
}

describe('BaseSlider', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, TRACK_WIDTH, 10),
    )
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('renders base classes, track, a single thumb and extremity values', () => {
      const wrapper = mountSlider({ modelValue: 40 })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['vsui', 'base-slider']))
      expect(wrapper.find('.base-slider__track').exists()).toBe(true)
      expect(wrapper.find('.base-slider__track-fill').exists()).toBe(true)
      expect(wrapper.findAll('.base-slider__thumb')).toHaveLength(1)
      expect(wrapper.find('.base-slider__extremity-value--min').text()).toBe('0')
      expect(wrapper.find('.base-slider__extremity-value--max').text()).toBe('100')
    })

    it('exposes the thumb as an accessible slider', () => {
      const wrapper = mountSlider({ modelValue: 40, min: 10, max: 90 })
      const thumb = wrapper.find('.base-slider__thumb')

      expect(thumb.attributes('role')).toBe('slider')
      expect(thumb.attributes('tabindex')).toBe('0')
      expect(thumb.attributes('aria-valuemin')).toBe('10')
      expect(thumb.attributes('aria-valuemax')).toBe('90')
      expect(thumb.attributes('aria-valuenow')).toBe('40')
      expect(thumb.attributes('aria-valuetext')).toBe('40')
      expect(thumb.attributes('aria-disabled')).toBe('false')
    })

    it('positions the thumb and the track fill from the value', () => {
      const wrapper = mountSlider({ modelValue: 25, min: 0, max: 100 })

      expect((wrapper.find('.base-slider__thumb').element as HTMLElement).style.left).toBe('25%')
      expect((wrapper.find('.base-slider__track-fill').element as HTMLElement).style.width).toBe(
        '25%',
      )
    })

    it('respects min and max when computing the position', () => {
      const wrapper = mountSlider({ modelValue: 15, min: 10, max: 20 })

      expect((wrapper.find('.base-slider__thumb').element as HTMLElement).style.left).toBe('50%')
    })

    it('shows the current value in the thumb bubble by default', () => {
      const wrapper = mountSlider({ modelValue: 40 })

      expect(wrapper.find('.base-slider__thumb-value').text()).toBe('40')
    })

    it('hides the thumb bubble when showValue is false', () => {
      const wrapper = mountSlider({ modelValue: 40, showValue: false })

      expect(wrapper.find('.base-slider__thumb-value').exists()).toBe(false)
    })

    it('formats the thumb value, aria-valuetext and extremities with formatValue', () => {
      const wrapper = mountSlider({
        modelValue: 40,
        formatValue: (value: number) => `${value}%`,
      })

      expect(wrapper.find('.base-slider__thumb-value').text()).toBe('40%')
      expect(wrapper.find('.base-slider__thumb').attributes('aria-valuetext')).toBe('40%')
      expect(wrapper.find('.base-slider__extremity-value--min').text()).toBe('0%')
      expect(wrapper.find('.base-slider__extremity-value--max').text()).toBe('100%')
    })

    it('renders the label with a required marker', () => {
      const wrapper = mountSlider({ label: 'Volume', required: true, id: 'vol' })
      const label = wrapper.find('.base-slider__label')

      expect(label.text()).toContain('Volume')
      expect(label.find('.base-slider__required').text()).toBe('*')
      expect(label.attributes('for')).toBe('vol')
    })

    it('does not render a label or required marker by default', () => {
      const wrapper = mountSlider()

      expect(wrapper.find('.base-slider__label').exists()).toBe(false)
      expect(wrapper.find('.base-slider__required').exists()).toBe(false)
    })

    it('renders helper text and prefers the error message over it', () => {
      const helper = mountSlider({ helperText: 'Pick a value' })
      expect(helper.find('.base-slider__helper').text()).toBe('Pick a value')

      const error = mountSlider({ helperText: 'Pick a value', errorMessage: 'Too low' })
      expect(error.find('.base-slider__helper').text()).toBe('Too low')

      expect(mountSlider().find('.base-slider__helper').exists()).toBe(false)
    })

    it.each([
      ['success', 'base-slider--success'],
      ['error', 'base-slider--error'],
      ['warning', 'base-slider--warning'],
    ] as const)('applies the %s state class', (state, expectedClass) => {
      const wrapper = mountSlider({ state })

      expect(wrapper.classes()).toContain(expectedClass)
    })

    it('applies the filled variant class and none for the default variant', () => {
      expect(mountSlider({ variant: 'filled' }).classes()).toContain('base-slider--filled')
      expect(mountSlider().classes()).not.toContain('base-slider--filled')
    })

    it('renders marks with labels and the active state', () => {
      const wrapper = mountSlider({
        modelValue: 50,
        marks: [{ value: 0, label: 'Low' }, { value: 50, label: 'Mid' }, { value: 100 }],
      })
      const marks = wrapper.findAll('.base-slider__mark')

      expect(marks).toHaveLength(3)
      expect(wrapper.findAll('.base-slider__mark-label').map((l) => l.text())).toEqual([
        'Low',
        'Mid',
      ])
      expect(marks.map((m) => m.classes('base-slider__mark--active'))).toEqual([true, true, false])
      expect((marks[1].element as HTMLElement).style.left).toBe('calc(50%)')
    })
  })

  describe('mouse interaction (single)', () => {
    it('emits update:modelValue and change when the track is clicked', async () => {
      const wrapper = mountSlider({ modelValue: 0 })

      await wrapper.find('.base-slider__track').trigger('mousedown', { clientX: 30 })

      expect(wrapper.emitted('change')).toEqual([[30]])
      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([30])
    })

    it('snaps to the step', async () => {
      const wrapper = mountSlider({ modelValue: 0, step: 10 })
      const track = wrapper.find('.base-slider__track')

      await track.trigger('mousedown', { clientX: 34 })
      expect(lastEmitted(wrapper, 'change')).toBe(30)

      await track.trigger('mousedown', { clientX: 36 })
      expect(lastEmitted(wrapper, 'change')).toBe(40)
    })

    it('maps the click position into the min..max range', async () => {
      const wrapper = mountSlider({ modelValue: 10, min: 10, max: 20 })

      await wrapper.find('.base-slider__track').trigger('mousedown', { clientX: 50 })

      expect(lastEmitted(wrapper, 'change')).toBe(15)
    })

    it('clamps clicks outside the track to min and max', async () => {
      const wrapper = mountSlider({ modelValue: 50 })
      const track = wrapper.find('.base-slider__track')

      await track.trigger('mousedown', { clientX: 250 })
      expect(lastEmitted(wrapper, 'change')).toBe(100)

      await track.trigger('mousedown', { clientX: -40 })
      expect(lastEmitted(wrapper, 'change')).toBe(0)
    })

    it('reflects the new value in the thumb position', async () => {
      const wrapper = mountSlider({ modelValue: 0 })

      await wrapper.find('.base-slider__track').trigger('mousedown', { clientX: 70 })

      expect((wrapper.find('.base-slider__thumb').element as HTMLElement).style.left).toBe('70%')
      expect(wrapper.find('.base-slider__thumb-value').text()).toBe('70')
    })

    it('follows the model value when the parent updates it', async () => {
      const wrapper = mountSlider({ modelValue: 10 })

      await wrapper.setProps({ modelValue: 80 })

      expect((wrapper.find('.base-slider__thumb').element as HTMLElement).style.left).toBe('80%')
      expect(wrapper.find('.base-slider__thumb').attributes('aria-valuenow')).toBe('80')
    })

    it('supports being used with v-model through onUpdate:modelValue', async () => {
      const wrapper = mountSlider({
        modelValue: 0,
        'onUpdate:modelValue': (value: number | number[]) =>
          wrapper.setProps({ modelValue: value }),
      })

      await wrapper.find('.base-slider__track').trigger('mousedown', { clientX: 45 })
      await nextTick()

      expect(wrapper.props('modelValue')).toBe(45)
    })

    it('drags the thumb with mousemove on the document until mouseup', async () => {
      const wrapper = mountSlider({ modelValue: 0 })

      await wrapper.find('.base-slider__thumb').trigger('mousedown', { clientX: 20 })
      expect(lastEmitted(wrapper, 'change')).toBe(20)

      mouseOnDocument('mousemove', 70)
      await nextTick()
      expect(lastEmitted(wrapper, 'change')).toBe(70)
      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([20, 70])

      mouseOnDocument('mouseup')
      mouseOnDocument('mousemove', 90)
      await nextTick()

      expect(emittedValues(wrapper, 'change')).toEqual([20, 70])
    })

    it('does not also fire the track mousedown when the thumb is pressed', async () => {
      const wrapper = mountSlider({ modelValue: 0 })

      await wrapper.find('.base-slider__thumb').trigger('mousedown', { clientX: 20 })
      mouseOnDocument('mouseup')

      expect(wrapper.emitted('change')).toHaveLength(1)
    })
  })

  describe('touch interaction (single)', () => {
    it('updates the value on track touchstart using touches[0]', async () => {
      const wrapper = mountSlider({ modelValue: 0 })

      wrapper.find('.base-slider__track').element.dispatchEvent(touchEvent('touchstart', 40))
      await nextTick()

      expect(lastEmitted(wrapper, 'change')).toBe(40)
    })

    it('updates the value on thumb touchstart using touches[0]', async () => {
      const wrapper = mountSlider({ modelValue: 0 })

      wrapper.find('.base-slider__thumb').element.dispatchEvent(touchEvent('touchstart', 35))
      document.dispatchEvent(touchEvent('touchend', 0))
      await nextTick()

      expect(lastEmitted(wrapper, 'change')).toBe(35)
    })

    it('emits finite values while dragging with touch', async () => {
      const wrapper = mountSlider({ modelValue: 0 })

      try {
        wrapper.find('.base-slider__thumb').element.dispatchEvent(touchEvent('touchstart', 10))
        document.dispatchEvent(touchEvent('touchmove', 60))
        await nextTick()

        const values = emittedValues(wrapper, 'update:modelValue')
        expect(values.every((v) => typeof v === 'number' && Number.isFinite(v))).toBe(true)
        expect(lastEmitted(wrapper, 'change')).toBe(60)
      } finally {
        document.dispatchEvent(touchEvent('touchend', 0))
      }
    })
  })

  describe('keyboard (single)', () => {
    it.each<[string, number, number]>([
      ['ArrowRight', 50, 55],
      ['ArrowUp', 50, 55],
      ['ArrowLeft', 50, 45],
      ['ArrowDown', 50, 45],
      ['Home', 50, 0],
      ['End', 50, 100],
    ])('%s moves the value from %i to %i', async (key, start, expected) => {
      const wrapper = mountSlider({ modelValue: start, step: 5 })

      await wrapper.find('.base-slider__thumb').trigger('keydown', { key })

      expect(lastEmitted(wrapper, 'change')).toBe(expected)
      expect(lastEmitted(wrapper, 'update:modelValue')).toBe(expected)
    })

    it('does not go beyond min and max', async () => {
      const atMax = mountSlider({ modelValue: 100 })
      await atMax.find('.base-slider__thumb').trigger('keydown', { key: 'ArrowRight' })
      expect(lastEmitted(atMax, 'change')).toBe(100)

      const atMin = mountSlider({ modelValue: 0 })
      await atMin.find('.base-slider__thumb').trigger('keydown', { key: 'ArrowLeft' })
      expect(lastEmitted(atMin, 'change')).toBe(0)
    })

    it('prevents the default action for handled keys only', async () => {
      const wrapper = mountSlider({ modelValue: 10 })
      const thumb = wrapper.find('.base-slider__thumb')

      const handled = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })
      thumb.element.dispatchEvent(handled)
      expect(handled.defaultPrevented).toBe(true)

      const ignored = new KeyboardEvent('keydown', { key: 'a', cancelable: true })
      thumb.element.dispatchEvent(ignored)
      expect(ignored.defaultPrevented).toBe(false)
      expect(wrapper.emitted('change')).toHaveLength(1)
    })
  })

  describe('disabled', () => {
    it('adds the disabled class and aria-disabled', () => {
      const wrapper = mountSlider({ disabled: true })

      expect(wrapper.classes()).toContain('base-slider--disabled')
      expect(wrapper.find('.base-slider__thumb').attributes('aria-disabled')).toBe('true')
    })

    it('ignores mouse, drag and keyboard input', async () => {
      const wrapper = mountSlider({ modelValue: 10, disabled: true })

      await wrapper.find('.base-slider__track').trigger('mousedown', { clientX: 50 })
      await wrapper.find('.base-slider__thumb').trigger('mousedown', { clientX: 50 })
      mouseOnDocument('mousemove', 60)
      await wrapper.find('.base-slider__thumb').trigger('keydown', { key: 'ArrowRight' })
      await nextTick()

      expect(wrapper.emitted('change')).toBeUndefined()
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('range', () => {
    it('renders two thumbs and a fill spanning the selected interval', () => {
      const wrapper = mountSlider({ range: true, modelValue: [20, 80] })
      const thumbs = wrapper.findAll('.base-slider__thumb')
      const fill = wrapper.find('.base-slider__track-fill').element as HTMLElement

      expect(thumbs).toHaveLength(2)
      expect(thumbs.map((t) => (t.element as HTMLElement).style.left)).toEqual(['20%', '80%'])
      expect(thumbs.map((t) => t.attributes('aria-valuenow'))).toEqual(['20', '80'])
      expect(fill.style.left).toBe('20%')
      expect(fill.style.width).toBe('60%')
      expect(wrapper.findAll('.base-slider__thumb-value').map((v) => v.text())).toEqual([
        '20',
        '80',
      ])
    })

    it('formats each value with formatValue', () => {
      const wrapper = mountSlider({
        range: true,
        modelValue: [20, 80],
        formatValue: (value: number) => `$${value}`,
      })

      expect(wrapper.findAll('.base-slider__thumb-value').map((v) => v.text())).toEqual([
        '$20',
        '$80',
      ])
      expect(
        wrapper.findAll('.base-slider__thumb').map((t) => t.attributes('aria-valuetext')),
      ).toEqual(['$20', '$80'])
    })

    it('moves only the pressed thumb when dragging', async () => {
      const wrapper = mountSlider({ range: true, modelValue: [20, 80] })
      const thumbs = wrapper.findAll('.base-slider__thumb')

      await thumbs[1].trigger('mousedown', { clientX: 90 })
      mouseOnDocument('mouseup')

      expect(lastEmitted(wrapper, 'change')).toEqual([20, 90])
      expect(lastEmitted(wrapper, 'update:modelValue')).toEqual([20, 90])
    })

    it('does not let the start thumb pass the end thumb', async () => {
      const wrapper = mountSlider({ range: true, modelValue: [20, 80] })

      await wrapper.findAll('.base-slider__thumb')[0].trigger('mousedown', { clientX: 95 })
      mouseOnDocument('mouseup')

      expect(lastEmitted(wrapper, 'change')).toEqual([80, 80])
    })

    it('does not let the end thumb pass the start thumb', async () => {
      const wrapper = mountSlider({ range: true, modelValue: [20, 80] })

      await wrapper.findAll('.base-slider__thumb')[1].trigger('mousedown', { clientX: 5 })
      mouseOnDocument('mouseup')

      expect(lastEmitted(wrapper, 'change')).toEqual([20, 20])
    })

    it('moves each thumb independently with the keyboard', async () => {
      const wrapper = mountSlider({ range: true, modelValue: [20, 80] })
      const thumbs = wrapper.findAll('.base-slider__thumb')

      await thumbs[1].trigger('keydown', { key: 'ArrowRight' })
      expect(lastEmitted(wrapper, 'change')).toEqual([20, 81])

      await thumbs[0].trigger('keydown', { key: 'End' })
      expect(lastEmitted(wrapper, 'change')).toEqual([81, 81])
    })

    it('replaces a malformed range value with [min, max] on mount', async () => {
      const wrapper = mountSlider({ range: true, modelValue: [30] })
      await nextTick()

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([[0, 100]])
    })

    it('replaces an array value with min when range is off', async () => {
      const wrapper = mountSlider({ range: false, modelValue: [20, 80], min: 5 })
      await nextTick()

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([5])
      expect(wrapper.findAll('.base-slider__thumb')).toHaveLength(1)
    })

    it('marks are active only inside the selected interval', () => {
      const wrapper = mountSlider({
        range: true,
        modelValue: [20, 80],
        marks: [{ value: 10 }, { value: 50 }, { value: 90 }],
      })

      expect(
        wrapper.findAll('.base-slider__mark').map((m) => m.classes('base-slider__mark--active')),
      ).toEqual([false, true, false])
    })

    // BUG: range=true with the default numeric modelValue renders a single thumb
    it.fails('renders two thumbs when range is set without an array value', () => {
      const wrapper = mountSlider({ range: true })

      expect(wrapper.findAll('.base-slider__thumb')).toHaveLength(2)
    })

    // BUG: a track click in range mode always moves thumb 0, even near the right end
    it.fails('moves the end thumb when the track is clicked near the right end', async () => {
      const wrapper = mountSlider({ range: true, modelValue: [20, 80] })

      await wrapper.find('.base-slider__track').trigger('mousedown', { clientX: 95 })

      expect(lastEmitted(wrapper, 'change')).toEqual([20, 95])
    })
  })

  describe('exposed mounted payload', () => {
    it('emits mounted with the id, getValue and setValue', async () => {
      const wrapper = mountSlider({ id: 'my-slider', modelValue: 10 })
      const payload = (wrapper.emitted('mounted') ?? [])[0]?.[0] as {
        id: string
        getValue: () => number | number[]
        setValue: (value: number | number[]) => void
      }

      expect(wrapper.emitted('mounted')).toHaveLength(1)
      expect(payload.id).toBe('my-slider')
      expect(payload.getValue()).toBe(10)

      payload.setValue(60)
      await nextTick()

      expect(payload.getValue()).toBe(60)
      expect(lastEmitted(wrapper, 'update:modelValue')).toBe(60)
      expect((wrapper.find('.base-slider__thumb').element as HTMLElement).style.left).toBe('60%')
    })

    it('generates an id when none is provided', () => {
      const wrapper = mountSlider()
      const payload = (wrapper.emitted('mounted') ?? [])[0]?.[0] as { id: string }

      expect(payload.id).toMatch(/^slider-\d+$/)
    })
  })

  describe('known defects', () => {
    it('emits clean decimals for fractional steps', async () => {
      const wrapper = mountSlider({ modelValue: 0, min: 0, max: 1, step: 0.1 })

      await wrapper.find('.base-slider__track').trigger('mousedown', { clientX: 30 })

      expect(lastEmitted(wrapper, 'change')).toBe(0.3)
    })

    it('uses min as the origin of the step grid', async () => {
      const wrapper = mountSlider({ modelValue: 1, min: 1, max: 11, step: 5 })

      await wrapper.find('.base-slider__track').trigger('mousedown', { clientX: 50 })

      expect(lastEmitted(wrapper, 'change')).toBe(6)
    })

    it('clamps an out-of-range modelValue in the rendered thumb position', () => {
      const wrapper = mountSlider({ modelValue: 150, max: 100 })

      expect((wrapper.find('.base-slider__thumb').element as HTMLElement).style.left).toBe('100%')
    })

    // BUG: an external prop change is echoed back as update:modelValue
    it.fails('does not emit update:modelValue on a pure prop change', async () => {
      const wrapper = mountSlider({ modelValue: 10 })

      await wrapper.setProps({ modelValue: 40 })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    // BUG: label `for` points at an id that no element carries
    it.fails('links the label to an existing element', () => {
      const wrapper = mountSlider({ label: 'Volume' }, true)
      const target = wrapper.find('.base-slider__label').attributes('for')

      expect(target).toBeTruthy()
      expect(document.getElementById(target as string)).not.toBeNull()
    })
  })
})
