import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import BaseSwitch from '../../src/components/BaseSwitch.vue'

type SwitchProps = InstanceType<typeof BaseSwitch>['$props']
type SwitchValue = boolean | string | number

interface SwitchMountedPayload {
  id: string
  getValue: () => SwitchValue
  setValue: (value: SwitchValue) => void
}

enableAutoUnmount(afterEach)

function mountSwitch(props: SwitchProps = {}): VueWrapper {
  return mount(BaseSwitch, { props })
}

function input(wrapper: VueWrapper): HTMLInputElement {
  return wrapper.find<HTMLInputElement>('input.base-switch__input').element
}

function emittedValues(wrapper: VueWrapper, event: string): unknown[] {
  return (wrapper.emitted(event) ?? []).map((args) => args[0])
}

function keydown(wrapper: VueWrapper, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true })
  input(wrapper).dispatchEvent(event)
  return event
}

describe('BaseSwitch', () => {
  describe('rendering', () => {
    it('renders the base classes, a checkbox input, a track and a thumb', () => {
      const wrapper = mountSwitch()

      expect(wrapper.classes()).toEqual(
        expect.arrayContaining([
          'vsui',
          'base-switch',
          'base-switch--medium',
          'base-switch--default',
        ]),
      )
      expect(wrapper.find('input.base-switch__input').attributes('type')).toBe('checkbox')
      expect(wrapper.find('.base-switch__track').exists()).toBe(true)
      expect(wrapper.find('.base-switch__thumb').exists()).toBe(true)
    })

    it.each(['small', 'medium', 'large'] as const)('applies the %s size class', (size) => {
      expect(mountSwitch({ size }).classes()).toContain(`base-switch--${size}`)
    })

    it('applies the filled variant class', () => {
      expect(mountSwitch({ variant: 'filled' }).classes()).toContain('base-switch--filled')
    })

    it.each(['success', 'error', 'warning'] as const)('applies the %s state class', (state) => {
      expect(mountSwitch({ state }).classes()).toContain(`base-switch--${state}`)
    })

    it('does not add a state class when no state is set', () => {
      const classes = mountSwitch().classes()

      expect(classes.some((c) => /--(success|error|warning|null)$/.test(c))).toBe(false)
    })

    it('uses the id prop on the input and generates one otherwise', () => {
      expect(mountSwitch({ id: 'notify' }).find('input').attributes('id')).toBe('notify')
      expect(mountSwitch().find('input').attributes('id')).toMatch(/^switch-\d+$/)
    })

    it('forwards name, required and aria attributes to the input', () => {
      const wrapper = mountSwitch({ name: 'notifications', required: true, modelValue: true })
      const field = wrapper.find('input')

      expect(field.attributes('name')).toBe('notifications')
      expect(field.attributes('required')).toBeDefined()
      expect(field.attributes('aria-required')).toBe('true')
      expect(field.attributes('aria-checked')).toBe('true')
    })

    it('renders helper text and prefers the error message', () => {
      expect(mountSwitch({ helperText: 'Help' }).find('.base-switch__helper').text()).toBe('Help')

      const withError = mountSwitch({ helperText: 'Help', errorMessage: 'Broken' })
      expect(withError.find('.base-switch__helper').text()).toBe('Broken')
      expect(withError.find('.base-switch__helper').classes()).toContain(
        'base-switch__helper--error',
      )

      expect(mountSwitch().find('.base-switch__helper').exists()).toBe(false)
    })

    it('flags the helper as an error when state is error', () => {
      const wrapper = mountSwitch({ state: 'error', helperText: 'Help' })

      expect(wrapper.find('.base-switch__helper').classes()).toContain('base-switch__helper--error')
    })
  })

  describe('labels', () => {
    it.each(['top', 'left', 'right'] as const)(
      'renders the label at the %s position',
      (position) => {
        const wrapper = mountSwitch({ label: 'Notifications', labelPosition: position })

        expect(wrapper.classes()).toContain(`base-switch--label-${position}`)
        expect(wrapper.findAll('.base-switch__label')).toHaveLength(1)
        expect(wrapper.find(`.base-switch__label--${position}`).text()).toContain('Notifications')
      },
    )

    it('places the label on the right by default and links it to the input', () => {
      const wrapper = mountSwitch({ label: 'Notifications', id: 'sw' })

      expect(wrapper.find('.base-switch__label--right').exists()).toBe(true)
      expect(wrapper.find('.base-switch__label').attributes('for')).toBe('sw')
    })

    it('renders a required marker next to the label', () => {
      const wrapper = mountSwitch({ label: 'Notifications', required: true })

      expect(wrapper.find('.base-switch__required').text()).toBe('*')
    })

    it('renders no label without the label prop', () => {
      const wrapper = mountSwitch()

      expect(wrapper.find('.base-switch__label').exists()).toBe(false)
      expect(wrapper.classes().some((c) => c.startsWith('base-switch--label-'))).toBe(false)
    })

    it('shows onLabel inside the track while on and offLabel while off', async () => {
      const wrapper = mountSwitch({ modelValue: false, onLabel: 'ON', offLabel: 'OFF' })

      expect(wrapper.find('.base-switch__track-label--off').text()).toBe('OFF')
      expect(wrapper.find('.base-switch__track-label--on').exists()).toBe(false)

      await wrapper.setProps({ modelValue: true })

      expect(wrapper.find('.base-switch__track-label--on').text()).toBe('ON')
      expect(wrapper.find('.base-switch__track-label--off').exists()).toBe(false)
    })
  })

  describe('boolean model', () => {
    it('is off by default', () => {
      const wrapper = mountSwitch()

      expect(input(wrapper).checked).toBe(false)
      expect(wrapper.classes()).not.toContain('base-switch--on')
    })

    it('is on when modelValue is true', () => {
      const wrapper = mountSwitch({ modelValue: true })

      expect(input(wrapper).checked).toBe(true)
      expect(wrapper.classes()).toContain('base-switch--on')
    })

    it('emits update:modelValue and change with true when toggled on', async () => {
      const wrapper = mountSwitch({ modelValue: false })

      await wrapper.find('input').trigger('change')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([true])
      expect(emittedValues(wrapper, 'change')).toEqual([true])
    })

    it('emits false when toggled off', async () => {
      const wrapper = mountSwitch({ modelValue: true })

      await wrapper.find('input').trigger('change')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([false])
      expect(emittedValues(wrapper, 'change')).toEqual([false])
    })

    it('updates its own state after a toggle even without a parent', async () => {
      const wrapper = mountSwitch({ modelValue: false })

      await wrapper.find('input').trigger('change')

      expect(input(wrapper).checked).toBe(true)
      expect(wrapper.classes()).toContain('base-switch--on')

      await wrapper.find('input').trigger('change')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([true, false])
    })

    it('follows modelValue changes from the parent without emitting', async () => {
      const wrapper = mountSwitch({ modelValue: false })

      await wrapper.setProps({ modelValue: true })

      expect(wrapper.classes()).toContain('base-switch--on')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('change')).toBeUndefined()
    })

    it('works with v-model through onUpdate:modelValue', async () => {
      const wrapper = mountSwitch({
        modelValue: false,
        'onUpdate:modelValue': (value: SwitchValue) => wrapper.setProps({ modelValue: value }),
      })

      await wrapper.find('input').trigger('change')

      expect((wrapper.props() as Record<string, unknown>).modelValue).toBe(true)
    })
  })

  describe('custom on/off values', () => {
    it('is on only when modelValue equals onValue', () => {
      expect(
        mountSwitch({ modelValue: 'yes', onValue: 'yes', offValue: 'no' }).classes(),
      ).toContain('base-switch--on')
      expect(
        mountSwitch({ modelValue: 'no', onValue: 'yes', offValue: 'no' }).classes(),
      ).not.toContain('base-switch--on')
    })

    it('toggles between string values', async () => {
      const wrapper = mountSwitch({ modelValue: 'no', onValue: 'yes', offValue: 'no' })

      await wrapper.find('input').trigger('change')
      await wrapper.find('input').trigger('change')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['yes', 'no'])
      expect(emittedValues(wrapper, 'change')).toEqual(['yes', 'no'])
    })

    it('toggles between numeric values', async () => {
      const wrapper = mountSwitch({ modelValue: 0, onValue: 1, offValue: 0 })

      await wrapper.find('input').trigger('change')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([1])
      expect(wrapper.classes()).toContain('base-switch--on')
    })

    // BUG: an empty-string offValue is cast to `true` by Vue's boolean prop casting
    it.fails('emits an empty-string offValue when toggled back off', async () => {
      const wrapper = mountSwitch({ modelValue: 'on', onValue: 'on', offValue: '' })

      await wrapper.find('input').trigger('change')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([''])
    })
  })

  describe('keyboard', () => {
    it('toggles with Enter and prevents the default action', async () => {
      const wrapper = mountSwitch({ modelValue: false })

      const event = keydown(wrapper, 'Enter')
      await nextTick()

      expect(event.defaultPrevented).toBe(true)
      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([true])
      expect(emittedValues(wrapper, 'change')).toEqual([true])
    })

    it('toggles with Space and prevents the default action', async () => {
      const wrapper = mountSwitch({ modelValue: true })

      const event = keydown(wrapper, ' ')
      await nextTick()

      expect(event.defaultPrevented).toBe(true)
      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([false])
    })

    it('ignores other keys', async () => {
      const wrapper = mountSwitch()

      const event = keydown(wrapper, 'a')
      await nextTick()

      expect(event.defaultPrevented).toBe(false)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('tracks focus and blur with the focused class', async () => {
      const wrapper = mountSwitch()

      await wrapper.find('input').trigger('focus')
      expect(wrapper.classes()).toContain('base-switch--focused')

      await wrapper.find('input').trigger('blur')
      expect(wrapper.classes()).not.toContain('base-switch--focused')
    })
  })

  describe('disabled and loading', () => {
    it('disables the input and adds the disabled class', () => {
      const wrapper = mountSwitch({ disabled: true })

      expect(input(wrapper).disabled).toBe(true)
      expect(wrapper.classes()).toContain('base-switch--disabled')
    })

    it('does not toggle by change or keyboard while disabled', async () => {
      const wrapper = mountSwitch({ disabled: true })

      input(wrapper).dispatchEvent(new Event('change'))
      keydown(wrapper, 'Enter')
      keydown(wrapper, ' ')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
      expect(wrapper.emitted('change')).toBeUndefined()
    })

    it('behaves as disabled while loading and renders a spinner', async () => {
      const wrapper = mountSwitch({ loading: true })

      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['base-switch--loading', 'base-switch--disabled']),
      )
      expect(input(wrapper).disabled).toBe(true)
      expect(wrapper.find('.base-switch__spinner').exists()).toBe(true)

      input(wrapper).dispatchEvent(new Event('change'))
      keydown(wrapper, 'Enter')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('has no spinner when not loading', () => {
      expect(mountSwitch().find('.base-switch__spinner').exists()).toBe(false)
    })
  })

  describe('mounted payload', () => {
    it('emits mounted with id, getValue and setValue', async () => {
      const wrapper = mountSwitch({ id: 'sw', modelValue: true })
      const payload = wrapper.emitted('mounted')?.[0][0] as SwitchMountedPayload

      expect(wrapper.emitted('mounted')).toHaveLength(1)
      expect(payload.id).toBe('sw')
      expect(payload.getValue()).toBe(true)

      payload.setValue(false)
      await nextTick()

      expect(payload.getValue()).toBe(false)
      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([false])
      expect(wrapper.emitted('change')).toBeUndefined()
      expect(wrapper.classes()).not.toContain('base-switch--on')
    })
  })

  describe('known defects', () => {
    // BUG: the switch input has no role="switch", so assistive tech announces a plain checkbox
    it.fails('exposes role="switch" on the input', () => {
      expect(mountSwitch().find('input').attributes('role')).toBe('switch')
    })
  })
})
