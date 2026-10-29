import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import BaseCheckbox from '../../src/components/BaseCheckbox.vue'

type CheckboxProps = InstanceType<typeof BaseCheckbox>['$props']

enableAutoUnmount(afterEach)

function mountCheckbox(
  props: CheckboxProps = {},
  slots: Record<string, string> = {},
  attachToBody = false,
): VueWrapper {
  return mount(BaseCheckbox, { props, slots, attachTo: attachToBody ? document.body : undefined })
}

function box(wrapper: VueWrapper): HTMLInputElement {
  return wrapper.find<HTMLInputElement>('input[type="checkbox"]').element
}

function emittedValues(wrapper: VueWrapper): unknown[] {
  return (wrapper.emitted('update:modelValue') ?? []).map((args) => args[0])
}

describe('BaseCheckbox', () => {
  describe('rendering', () => {
    it('renders a label root with the base classes and a native checkbox', () => {
      const wrapper = mountCheckbox()

      expect(wrapper.element.tagName).toBe('LABEL')
      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['vsui', 'base-checkbox', 'base-checkbox--medium']),
      )
      expect(wrapper.find('input.base-checkbox__input').attributes('type')).toBe('checkbox')
      expect(wrapper.find('.base-checkbox__checkmark').exists()).toBe(true)
    })

    it.each(['small', 'medium', 'large'] as const)('applies the %s size class', (size) => {
      expect(mountCheckbox({ size }).classes()).toContain(`base-checkbox--${size}`)
    })

    it('applies the disabled and error classes', () => {
      const wrapper = mountCheckbox({ disabled: true, error: true })

      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['base-checkbox--disabled', 'base-checkbox--error']),
      )
      expect(box(wrapper).disabled).toBe(true)
    })

    it('does not apply the disabled and error classes by default', () => {
      const wrapper = mountCheckbox()

      expect(wrapper.classes()).not.toContain('base-checkbox--disabled')
      expect(wrapper.classes()).not.toContain('base-checkbox--error')
      expect(box(wrapper).disabled).toBe(false)
    })

    it('uses the id prop on the input and generates one otherwise', () => {
      expect(mountCheckbox({ id: 'terms' }).find('input').attributes('id')).toBe('terms')
      expect(mountCheckbox().find('input').attributes('id')).toMatch(/^checkbox-\d+$/)
    })

    it('renders the label prop', () => {
      const wrapper = mountCheckbox({ label: 'Accept terms' })

      expect(wrapper.find('.base-checkbox__label').text()).toBe('Accept terms')
    })

    it('renders the default slot instead of the label prop', () => {
      const wrapper = mountCheckbox({ label: 'Ignored' }, { default: '<b>Custom</b>' })

      expect(wrapper.find('.base-checkbox__label').html()).toContain('<b>Custom</b>')
      expect(wrapper.find('.base-checkbox__label').text()).toBe('Custom')
    })

    it('renders no label element without label or slot', () => {
      expect(mountCheckbox().find('.base-checkbox__label').exists()).toBe(false)
    })

    it('renders the checkmark slot instead of the built-in icons', () => {
      const wrapper = mountCheckbox({ modelValue: true }, { checkmark: '<i class="my-icon"></i>' })

      expect(wrapper.find('.base-checkbox__checkmark .my-icon').exists()).toBe(true)
      expect(wrapper.find('.base-checkbox__checkmark svg').exists()).toBe(false)
    })
  })

  describe('boolean model', () => {
    it('is unchecked by default and shows no checkmark', () => {
      const wrapper = mountCheckbox()

      expect(box(wrapper).checked).toBe(false)
      expect(wrapper.find('.base-checkbox__checkmark svg').exists()).toBe(false)
    })

    it('reflects modelValue=true as checked with a checkmark', () => {
      const wrapper = mountCheckbox({ modelValue: true })

      expect(box(wrapper).checked).toBe(true)
      expect(wrapper.findAll('.base-checkbox__checkmark svg')).toHaveLength(1)
      expect(wrapper.find('.base-checkbox__checkmark path').attributes('d')).toBe(
        'M11.6666 3.5L5.24992 9.91667L2.33325 7',
      )
    })

    it('emits true when checked and false when unchecked', async () => {
      const wrapper = mountCheckbox({ modelValue: false })

      await wrapper.find('input').setValue(true)
      expect(emittedValues(wrapper)).toEqual([true])

      await wrapper.setProps({ modelValue: true })
      await wrapper.find('input').setValue(false)
      expect(emittedValues(wrapper)).toEqual([true, false])
    })

    it('follows the model value when the parent changes it', async () => {
      const wrapper = mountCheckbox({ modelValue: false })

      await wrapper.setProps({ modelValue: true })

      expect(box(wrapper).checked).toBe(true)
    })

    it('works with v-model through onUpdate:modelValue', async () => {
      const wrapper = mountCheckbox({
        modelValue: false,
        'onUpdate:modelValue': (value: boolean | unknown[]) =>
          wrapper.setProps({ modelValue: value }),
      })

      await wrapper.find('input').setValue(true)

      expect((wrapper.props() as Record<string, unknown>).modelValue).toBe(true)
      expect(wrapper.findAll('.base-checkbox__checkmark svg')).toHaveLength(1)
    })
  })

  describe('array model', () => {
    it('is checked when the value is included in the array', () => {
      expect(box(mountCheckbox({ modelValue: ['a', 'b'], value: 'a' })).checked).toBe(true)
      expect(box(mountCheckbox({ modelValue: ['a', 'b'], value: 'c' })).checked).toBe(false)
    })

    it('adds the value when checked, without mutating the original array', async () => {
      const original = ['a']
      const wrapper = mountCheckbox({ modelValue: original, value: 'b' })

      await wrapper.find('input').setValue(true)

      expect(emittedValues(wrapper)).toEqual([['a', 'b']])
      expect(original).toEqual(['a'])
    })

    it('removes the value when unchecked', async () => {
      const wrapper = mountCheckbox({ modelValue: ['a', 'b', 'c'], value: 'b' })

      await wrapper.find('input').setValue(false)

      expect(emittedValues(wrapper)).toEqual([['a', 'c']])
    })

    it('supports numeric values', async () => {
      const wrapper = mountCheckbox({ modelValue: [1, 2], value: 3 })

      await wrapper.find('input').setValue(true)

      expect(emittedValues(wrapper)).toEqual([[1, 2, 3]])
    })

    it('matches the same object reference', () => {
      const option = { id: 1 }

      expect(box(mountCheckbox({ modelValue: [option], value: option })).checked).toBe(true)
    })

    it('shows the checkmark only when the value is in the array', () => {
      expect(
        mountCheckbox({ modelValue: ['a'], value: 'a' }).findAll('.base-checkbox__checkmark svg'),
      ).toHaveLength(1)
      expect(
        mountCheckbox({ modelValue: ['a'], value: 'b' }).findAll('.base-checkbox__checkmark svg'),
      ).toHaveLength(0)
    })
  })

  describe('indeterminate', () => {
    it('sets the DOM indeterminate state and renders the dash icon', () => {
      const wrapper = mountCheckbox({ indeterminate: true })

      expect(box(wrapper).indeterminate).toBe(true)
      expect(wrapper.findAll('.base-checkbox__checkmark svg')).toHaveLength(1)
      expect(wrapper.find('.base-checkbox__checkmark path').attributes('d')).toBe(
        'M2.91675 7H11.0834',
      )
    })

    it('shows the dash instead of the checkmark when checked and indeterminate', () => {
      const wrapper = mountCheckbox({ modelValue: true, indeterminate: true })

      expect(wrapper.findAll('.base-checkbox__checkmark svg')).toHaveLength(1)
      expect(wrapper.find('.base-checkbox__checkmark path').attributes('d')).toBe(
        'M2.91675 7H11.0834',
      )
    })

    it('is not indeterminate by default', () => {
      expect(box(mountCheckbox()).indeterminate).toBe(false)
    })
  })

  describe('known defects', () => {
    // BUG: the browser clears `indeterminate` on click but the prop stays true, so the DOM desyncs
    it.fails('keeps the DOM indeterminate state in sync with the prop after a click', async () => {
      const wrapper = mountCheckbox({ indeterminate: true }, {}, true)

      box(wrapper).click()
      await wrapper.vm.$nextTick()

      expect((wrapper.props() as Record<string, unknown>).indeterminate).toBe(true)
      expect(box(wrapper).indeterminate).toBe(true)
    })

    // BUG: array models compare values by identity, so a structurally equal clone is not checked
    it.fails('treats a clone of an object value as checked', () => {
      const wrapper = mountCheckbox({ modelValue: [{ id: 1 }], value: { id: 1 } })

      expect(box(wrapper).checked).toBe(true)
    })
  })
})
