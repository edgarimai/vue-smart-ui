import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import BaseColorPicker from '../../src/components/BaseColorPicker.vue'

type ColorPickerProps = InstanceType<typeof BaseColorPicker>['$props']

interface ColorPickerMountedPayload {
  validate: () => boolean
  focus: () => void
}

enableAutoUnmount(afterEach)

afterEach(() => {
  vi.useRealTimers()
})

function mountPicker(props: ColorPickerProps = {}, attachToBody = false): VueWrapper {
  return mount(BaseColorPicker, {
    props,
    attachTo: attachToBody ? document.body : undefined,
  })
}

function textInput(wrapper: VueWrapper): HTMLInputElement {
  return wrapper.find<HTMLInputElement>('input.base-input__field').element
}

function emittedValues(wrapper: VueWrapper, event: string): unknown[] {
  return (wrapper.emitted(event) ?? []).map((args) => args[0])
}

async function openPicker(wrapper: VueWrapper): Promise<void> {
  await wrapper.find('.base-color-picker__preview').trigger('click')
}

async function clickPreset(wrapper: VueWrapper, index: number): Promise<void> {
  await wrapper.findAll('.base-color-picker__preset')[index].trigger('click')
}

/** Opens the popup and clicks the preset that has the given colour. */
async function selectPreset(wrapper: VueWrapper): Promise<unknown> {
  await openPicker(wrapper)
  await clickPreset(wrapper, 0)
  return emittedValues(wrapper, 'update:modelValue').at(-1)
}

describe('BaseColorPicker', () => {
  describe('rendering', () => {
    it('renders the base classes, a text input and the colour preview', () => {
      const wrapper = mountPicker({ modelValue: '#ff0000' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['vsui', 'base-color-picker']))
      expect(wrapper.find('.base-color-picker__container').exists()).toBe(true)
      expect(textInput(wrapper).value).toBe('#ff0000')
      expect(
        (wrapper.find('.base-color-picker__preview').element as HTMLElement).style.backgroundColor,
      ).toBe('rgb(255, 0, 0)')
      expect(wrapper.find('.base-color-picker__icon').exists()).toBe(true)
    })

    it('defaults to #000000', () => {
      expect(textInput(mountPicker()).value).toBe('#000000')
    })

    it('updates the preview and the input when the model changes', async () => {
      const wrapper = mountPicker({ modelValue: '#ff0000' })

      await wrapper.setProps({ modelValue: '#00ff00' })

      expect(textInput(wrapper).value).toBe('#00ff00')
      expect(
        (wrapper.find('.base-color-picker__preview').element as HTMLElement).style.backgroundColor,
      ).toBe('rgb(0, 255, 0)')
    })

    it('hides the preview with showPreview=false', () => {
      const wrapper = mountPicker({ showPreview: false })

      expect(wrapper.find('.base-color-picker__preview').exists()).toBe(false)
      expect(wrapper.find('.base-color-picker__icon').exists()).toBe(true)
    })

    it('forwards label, helper text, state, variant, name and id to the input', () => {
      const wrapper = mountPicker({
        id: 'brand',
        label: 'Brand colour',
        helperText: 'Pick one',
        state: 'warning',
        variant: 'filled',
        name: 'brandColor',
        required: true,
      })

      expect(wrapper.find('.base-input__label').text()).toContain('Brand colour')
      expect(wrapper.find('.base-input__required').exists()).toBe(true)
      expect(wrapper.find('.base-input__helper').text()).toBe('Pick one')
      expect(wrapper.find('.base-input').classes()).toEqual(
        expect.arrayContaining(['base-input--warning', 'base-input--filled']),
      )
      expect(textInput(wrapper).id).toBe('brand')
      expect(textInput(wrapper).required).toBe(true)
    })

    it('forwards name to validation payloads (it is not rendered on the input)', () => {
      const wrapper = mountPicker({ name: 'brandColor', modelValue: 'oops' })
      const payload = wrapper.emitted('mounted')?.[0][0] as ColorPickerMountedPayload

      payload.validate()

      expect(textInput(wrapper).hasAttribute('name')).toBe(false)
      expect(emittedValues(wrapper, 'validation')).toEqual([
        { valid: false, error: 'Invalid HEX color', name: 'brandColor' },
      ])
    })

    it('disables and sets readonly on the input', () => {
      const disabled = mountPicker({ disabled: true })
      expect(disabled.classes()).toContain('base-color-picker--disabled')
      expect(textInput(disabled).disabled).toBe(true)

      expect(textInput(mountPicker({ readonly: true })).readOnly).toBe(true)
    })
  })

  describe('text input', () => {
    it('emits update:modelValue and input when the user types', async () => {
      const wrapper = mountPicker({ modelValue: '#000000' })

      await wrapper.find('input.base-input__field').setValue('#123456')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['#123456'])
      expect(emittedValues(wrapper, 'input')).toEqual([{ target: { value: '#123456' } }])
    })

    it('works with v-model through onUpdate:modelValue', async () => {
      const wrapper = mountPicker({
        modelValue: '#000000',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      })

      await wrapper.find('input.base-input__field').setValue('#abcdef')

      expect((wrapper.props() as Record<string, unknown>).modelValue).toBe('#abcdef')
      expect(
        (wrapper.find('.base-color-picker__preview').element as HTMLElement).style.backgroundColor,
      ).toBe('rgb(171, 205, 239)')
    })

    it('emits focus with the event', async () => {
      const wrapper = mountPicker({}, true)

      textInput(wrapper).focus()
      await nextTick()

      expect(wrapper.emitted('focus')).toHaveLength(1)
      expect(wrapper.emitted('focus')?.[0][0]).toBeInstanceOf(FocusEvent)
    })

    it('emits blur after a short delay', async () => {
      vi.useFakeTimers()
      const wrapper = mountPicker({}, true)

      textInput(wrapper).focus()
      textInput(wrapper).blur()
      expect(wrapper.emitted('blur')).toBeUndefined()

      vi.advanceTimersByTime(100)

      expect(wrapper.emitted('blur')).toHaveLength(1)
    })
  })

  describe('validation', () => {
    it('accepts a valid hex colour on blur', async () => {
      const wrapper = mountPicker({ modelValue: '#aabbcc' })

      await wrapper.find('input.base-input__field').trigger('blur')

      expect(emittedValues(wrapper, 'validation')).toEqual([{ valid: true, error: '' }])
    })

    it('accepts 3-digit hex colours', async () => {
      const wrapper = mountPicker({ modelValue: '#abc' })

      await wrapper.find('input.base-input__field').trigger('blur')

      expect(emittedValues(wrapper, 'validation')).toEqual([{ valid: true, error: '' }])
    })

    it('rejects an invalid hex colour and shows the message', async () => {
      const wrapper = mountPicker({ modelValue: 'not-a-colour' })

      await wrapper.find('input.base-input__field').trigger('blur')

      expect(emittedValues(wrapper, 'validation')).toEqual([
        { valid: false, error: 'Invalid HEX color' },
      ])
      expect(wrapper.find('.base-input__helper').text()).toBe('Invalid HEX color')
      expect(wrapper.find('.base-input').classes()).toContain('base-input--error')
    })

    it.each([
      ['rgb', 'rgb(1, 2, 3)', '#ffffff', 'Invalid RGB color'],
      ['rgba', 'rgba(1, 2, 3, 0.5)', 'rgb(1, 2, 3)', 'Invalid RGBA color'],
      ['hsl', 'hsl(217, 91%, 60%)', '#ffffff', 'Invalid HSL color'],
    ] as const)(
      'validates against the %s format',
      async (format, validValue, invalidValue, message) => {
        const valid = mountPicker({ modelValue: validValue, format })
        await valid.find('input.base-input__field').trigger('blur')
        expect(emittedValues(valid, 'validation')).toEqual([{ valid: true, error: '' }])

        const invalid = mountPicker({ modelValue: invalidValue, format })
        await invalid.find('input.base-input__field').trigger('blur')
        expect(emittedValues(invalid, 'validation')).toEqual([{ valid: false, error: message }])
      },
    )

    it('treats an empty value as valid unless required rules are added', async () => {
      const optional = mountPicker({ modelValue: '' })
      await optional.find('input.base-input__field').trigger('blur')
      expect(emittedValues(optional, 'validation')).toEqual([{ valid: true, error: '' }])

      const withRule = mountPicker({ modelValue: '', rules: ['required'] })
      await withRule.find('input.base-input__field').trigger('blur')
      expect(emittedValues(withRule, 'validation')[0]).toMatchObject({ valid: false })
    })

    it('combines custom rules with the format rule', async () => {
      const wrapper = mountPicker({
        modelValue: 'abc',
        rules: [{ validator: (value: unknown) => value === '#000000', message: 'Only black' }],
      })

      await wrapper.find('input.base-input__field').trigger('blur')

      // The custom rule runs first, so its message wins over the HEX format message.
      expect(emittedValues(wrapper, 'validation')).toEqual([{ valid: false, error: 'Only black' }])
    })
  })

  describe('mounted payload', () => {
    it('emits mounted with validate and focus', () => {
      const wrapper = mountPicker()
      const payload = wrapper.emitted('mounted')?.[0][0] as ColorPickerMountedPayload

      expect(wrapper.emitted('mounted')).toHaveLength(1)
      expect(typeof payload.validate).toBe('function')
      expect(typeof payload.focus).toBe('function')
    })

    it('validate() validates the current value and emits validation', () => {
      const wrapper = mountPicker({ modelValue: 'oops' })
      const payload = wrapper.emitted('mounted')?.[0][0] as ColorPickerMountedPayload

      expect(payload.validate()).toBe(false)
      expect(emittedValues(wrapper, 'validation')).toEqual([
        { valid: false, error: 'Invalid HEX color', name: '' },
      ])
    })

    it('focus() focuses the text input', () => {
      const wrapper = mountPicker({}, true)
      const payload = wrapper.emitted('mounted')?.[0][0] as ColorPickerMountedPayload

      payload.focus()

      expect(document.activeElement).toBe(textInput(wrapper))
    })
  })

  describe('popup', () => {
    it('is closed initially', () => {
      const wrapper = mountPicker()

      expect(wrapper.find('.base-color-picker__popup').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('base-color-picker--open')
    })

    it('opens and closes when the preview is clicked', async () => {
      const wrapper = mountPicker()

      await openPicker(wrapper)
      expect(wrapper.find('.base-color-picker__popup').exists()).toBe(true)
      expect(wrapper.classes()).toContain('base-color-picker--open')

      await openPicker(wrapper)
      expect(wrapper.find('.base-color-picker__popup').exists()).toBe(false)
    })

    it('also opens from the icon', async () => {
      const wrapper = mountPicker()

      await wrapper.find('.base-color-picker__icon').trigger('click')

      expect(wrapper.find('.base-color-picker__popup').exists()).toBe(true)
    })

    it('does not open when disabled or readonly', async () => {
      const disabled = mountPicker({ disabled: true })
      await openPicker(disabled)
      expect(disabled.find('.base-color-picker__popup').exists()).toBe(false)

      const readonly = mountPicker({ readonly: true })
      await openPicker(readonly)
      expect(readonly.find('.base-color-picker__popup').exists()).toBe(false)
    })

    it('focuses the popup when it opens', async () => {
      const wrapper = mountPicker({}, true)

      await openPicker(wrapper)
      await nextTick()

      expect(document.activeElement).toBe(wrapper.find('.base-color-picker__popup').element)
    })

    it('closes after the input blurs and focus is outside the popup', async () => {
      vi.useFakeTimers()
      const wrapper = mountPicker({}, true)
      await openPicker(wrapper)
      ;(document.activeElement as HTMLElement | null)?.blur()

      await wrapper.find('input.base-input__field').trigger('blur')
      vi.advanceTimersByTime(100)
      await nextTick()

      expect(wrapper.find('.base-color-picker__popup').exists()).toBe(false)
    })

    it('renders a native colour input bound to the model value', async () => {
      const wrapper = mountPicker({ modelValue: '#ff8800' })
      await openPicker(wrapper)

      const native = wrapper.find<HTMLInputElement>('input[type="color"]')

      expect(native.classes()).toContain('base-color-picker__color-input')
      expect(native.element.value).toBe('#ff8800')
    })

    it('emits the picked colour from the native input (hex format)', async () => {
      const wrapper = mountPicker({ modelValue: '#000000' })
      await openPicker(wrapper)

      await wrapper.find('input[type="color"]').setValue('#336699')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['#336699'])
      expect(emittedValues(wrapper, 'input')).toEqual([{ target: { value: '#336699' } }])
    })
  })

  describe('presets', () => {
    it('shows the 10 default presets', async () => {
      const wrapper = mountPicker()
      await openPicker(wrapper)

      const presets = wrapper.findAll('.base-color-picker__preset')

      expect(presets).toHaveLength(10)
      expect((presets[0].element as HTMLElement).style.backgroundColor).toBe('rgb(59, 130, 246)')
    })

    it('shows custom presets instead of the defaults', async () => {
      const wrapper = mountPicker({ presets: ['#ff0000', '#00ff00'] })
      await openPicker(wrapper)

      expect(wrapper.findAll('.base-color-picker__preset')).toHaveLength(2)
    })

    it('marks the preset equal to the model value as active', async () => {
      const wrapper = mountPicker({ modelValue: '#00ff00', presets: ['#ff0000', '#00ff00'] })
      await openPicker(wrapper)

      expect(
        wrapper
          .findAll('.base-color-picker__preset')
          .map((p) => p.classes('base-color-picker__preset--active')),
      ).toEqual([false, true])
    })

    it('emits the preset as-is for the hex format', async () => {
      const wrapper = mountPicker({ presets: ['#3b82f6'] })

      expect(await selectPreset(wrapper)).toBe('#3b82f6')
      expect(emittedValues(wrapper, 'input')).toEqual([{ target: { value: '#3b82f6' } }])
    })

    it('converts the preset to rgb', async () => {
      expect(await selectPreset(mountPicker({ presets: ['#3b82f6'], format: 'rgb' }))).toBe(
        'rgb(59, 130, 246)',
      )
    })

    it('converts the preset to rgba with full opacity', async () => {
      expect(await selectPreset(mountPicker({ presets: ['#3b82f6'], format: 'rgba' }))).toBe(
        'rgba(59, 130, 246, 1)',
      )
    })

    it('converts a chromatic preset to hsl', async () => {
      expect(await selectPreset(mountPicker({ presets: ['#3b82f6'], format: 'hsl' }))).toBe(
        'hsl(217, 91%, 60%)',
      )
      expect(await selectPreset(mountPicker({ presets: ['#ff0000'], format: 'hsl' }))).toBe(
        'hsl(0, 100%, 50%)',
      )
    })

    it('does not convert presets that are not hex colours', async () => {
      expect(await selectPreset(mountPicker({ presets: ['rebeccapurple'], format: 'rgb' }))).toBe(
        'rebeccapurple',
      )
    })

    it('emits validation right after a preset is selected', async () => {
      const wrapper = mountPicker({ presets: ['#3b82f6'] })
      await selectPreset(wrapper)
      await nextTick()

      expect(wrapper.emitted('validation')).toHaveLength(1)
    })
  })

  describe('known defects', () => {
    // BUG: the native colour input always emits #rrggbb, ignoring the configured format
    it.fails('emits an rgb() value from the native input when format is rgb', async () => {
      const wrapper = mountPicker({ modelValue: 'rgb(0, 0, 0)', format: 'rgb' })
      await openPicker(wrapper)

      await wrapper.find('input[type="color"]').setValue('#336699')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['rgb(51, 102, 153)'])
    })

    // BUG: HSL conversion for achromatic colours does not scale lightness (white gives 1%)
    it.fails('converts the white preset to hsl(0, 0%, 100%)', async () => {
      expect(await selectPreset(mountPicker({ presets: ['#ffffff'], format: 'hsl' }))).toBe(
        'hsl(0, 0%, 100%)',
      )
    })

    // BUG: HSL conversion for achromatic colours does not scale lightness (grey gives 0.50196%)
    it.fails('converts the grey preset to hsl(0, 0%, 50%)', async () => {
      expect(await selectPreset(mountPicker({ presets: ['#808080'], format: 'hsl' }))).toBe(
        'hsl(0, 0%, 50%)',
      )
    })

    // BUG: 3-digit hex presets are parsed as 6-digit, producing NaN channels
    it.fails('converts a 3-digit hex preset to rgb', async () => {
      expect(await selectPreset(mountPicker({ presets: ['#fff'], format: 'rgb' }))).toBe(
        'rgb(255, 255, 255)',
      )
    })

    // BUG: the swatch that opens the picker is a plain div without role or tabindex
    it.fails('makes the preview swatch keyboard focusable', () => {
      const preview = mountPicker().find('.base-color-picker__preview')

      expect(
        preview.attributes('tabindex') !== undefined || preview.attributes('role') === 'button',
      ).toBe(true)
    })

    // BUG: the icon that opens the picker is a plain div without role or tabindex
    it.fails('makes the picker icon keyboard focusable', () => {
      const icon = mountPicker().find('.base-color-picker__icon')

      expect(
        icon.attributes('tabindex') !== undefined || icon.attributes('role') === 'button',
      ).toBe(true)
    })
  })
})
