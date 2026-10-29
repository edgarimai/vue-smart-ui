import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import BaseOTP from '../../src/components/BaseOTP.vue'

type OtpProps = InstanceType<typeof BaseOTP>['$props']

interface OtpMountedPayload {
  validate: () => boolean
  focus: () => void
  reset: () => void
}

enableAutoUnmount(afterEach)

/** Mounts the OTP wired like `v-model`: every update:modelValue is fed back as a prop. */
function mountOtp(props: OtpProps = {}, attachToBody = true) {
  const wrapper: VueWrapper = mount(BaseOTP, {
    props: {
      ...props,
      'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: attachToBody ? document.body : undefined,
  })
  return wrapper
}

function fields(wrapper: VueWrapper): DOMWrapper<HTMLInputElement>[] {
  return wrapper.findAll<HTMLInputElement>('input.base-otp__field')
}

function values(wrapper: VueWrapper): string[] {
  return fields(wrapper).map((f) => f.element.value)
}

function emittedValues(wrapper: VueWrapper, event: string): unknown[] {
  return (wrapper.emitted(event) ?? []).map((args) => args[0])
}

function mountedPayload(wrapper: VueWrapper): OtpMountedPayload {
  return (wrapper.emitted('mounted') ?? [])[0][0] as OtpMountedPayload
}

function paste(target: Element, text: string): Event {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } })
  target.dispatchEvent(event)
  return event
}

/** Focuses a field the way a user would (fires focus and re-renders). */
async function focusField(wrapper: VueWrapper, index: number): Promise<void> {
  fields(wrapper)[index].element.focus()
  await nextTick()
}

describe('BaseOTP', () => {
  describe('rendering', () => {
    it('renders 6 inputs by default with the base classes', () => {
      const wrapper = mountOtp()

      expect(fields(wrapper)).toHaveLength(6)
      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['vsui', 'base-otp', 'base-otp--default']),
      )
      expect(wrapper.find('.base-otp__wrapper').exists()).toBe(true)
    })

    it('renders as many inputs as the length prop', () => {
      expect(fields(mountOtp({ length: 4 }))).toHaveLength(4)
      expect(fields(mountOtp({ length: 8 }))).toHaveLength(8)
    })

    it('limits each input to one character', () => {
      const wrapper = mountOtp()

      expect(fields(wrapper).every((f) => f.attributes('maxlength') === '1')).toBe(true)
    })

    it('derives input ids from the id prop', () => {
      const wrapper = mountOtp({ id: 'code', length: 3 })

      expect(fields(wrapper).map((f) => f.attributes('id'))).toEqual(['code-0', 'code-1', 'code-2'])
    })

    it('distributes the modelValue across the inputs', () => {
      const wrapper = mountOtp({ modelValue: '123', length: 6 })

      expect(values(wrapper)).toEqual(['1', '2', '3', '', '', ''])
    })

    it('renders type number by default and honours text and password', () => {
      expect(fields(mountOtp())[0].attributes('type')).toBe('number')
      expect(fields(mountOtp({ type: 'text' }))[0].attributes('type')).toBe('text')
      expect(fields(mountOtp({ type: 'password' }))[0].attributes('type')).toBe('password')
    })

    it('applies the variant class', () => {
      expect(mountOtp({ variant: 'filled' }).classes()).toContain('base-otp--filled')
    })

    it.each([
      ['success', 'base-otp--success'],
      ['error', 'base-otp--error'],
      ['warning', 'base-otp--warning'],
    ] as const)('applies the %s state class', (state, expectedClass) => {
      expect(mountOtp({ state }).classes()).toContain(expectedClass)
    })

    it('renders the label with a required marker', () => {
      const wrapper = mountOtp({ label: 'Code', required: true })

      expect(wrapper.find('.base-otp__label').text()).toContain('Code')
      expect(wrapper.find('.base-otp__required').text()).toBe('*')
      expect(fields(wrapper).every((f) => f.attributes('required') !== undefined)).toBe(true)
    })

    it('renders helper text and the default instructions', () => {
      const wrapper = mountOtp({ helperText: 'Check your SMS' })

      expect(wrapper.find('.base-otp__helper').text()).toBe('Check your SMS')
      expect(wrapper.find('.base-otp__instructions').text()).toBe(
        'Press Shift+Backspace to clear all fields',
      )
    })

    it('renders custom instructions and hides them when empty', () => {
      expect(
        mountOtp({ instructions: 'Type the code' }).find('.base-otp__instructions').text(),
      ).toBe('Type the code')
      expect(mountOtp({ instructions: '' }).find('.base-otp__instructions').exists()).toBe(false)
    })

    it('shows the errorMessage prop as the helper message', () => {
      const wrapper = mountOtp({ errorMessage: 'Invalid code' })

      expect(wrapper.find('.base-otp__helper').text()).toBe('Invalid code')
    })

    it('disables and marks every input as readonly when requested', () => {
      const disabled = mountOtp({ disabled: true })
      expect(disabled.classes()).toContain('base-otp--disabled')
      expect(fields(disabled).every((f) => f.attributes('disabled') !== undefined)).toBe(true)

      const readonly = mountOtp({ readonly: true })
      expect(fields(readonly).every((f) => f.attributes('readonly') !== undefined)).toBe(true)
    })

    it('toggles the focused class with focus and blur', async () => {
      const wrapper = mountOtp()

      await focusField(wrapper, 0)
      expect(wrapper.classes()).toContain('base-otp--focused')
      expect(fields(wrapper)[0].classes()).toContain('base-otp__field--focused')

      fields(wrapper)[0].element.blur()
      await nextTick()
      expect(wrapper.classes()).not.toContain('base-otp--focused')
    })
  })

  describe('typing', () => {
    it('emits update:modelValue with the typed character', async () => {
      const wrapper = mountOtp()
      await focusField(wrapper, 0)

      await fields(wrapper)[0].setValue('1')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['1'])
    })

    it('moves focus to the next input after a character is typed', async () => {
      const wrapper = mountOtp()
      await focusField(wrapper, 0)

      await fields(wrapper)[0].setValue('1')

      expect(document.activeElement).toBe(fields(wrapper)[1].element)
    })

    it('does not move focus past the last input', async () => {
      const wrapper = mountOtp({ length: 3 })
      await focusField(wrapper, 2)

      await fields(wrapper)[2].setValue('9')

      expect(document.activeElement).toBe(fields(wrapper)[2].element)
    })

    it('builds the value one character at a time and updates the inputs', async () => {
      const wrapper = mountOtp({ length: 4 })
      await focusField(wrapper, 0)

      await fields(wrapper)[0].setValue('1')
      await fields(wrapper)[1].setValue('2')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['1', '12'])
      expect(values(wrapper)).toEqual(['1', '2', '', ''])
    })

    it('keeps only the last character when more than one is entered', async () => {
      const wrapper = mountOtp({ modelValue: '1', length: 4 })
      await focusField(wrapper, 0)

      await fields(wrapper)[0].setValue('12')

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['2'])
    })

    it('emits complete once every input is filled', async () => {
      const wrapper = mountOtp({ length: 4 })
      await focusField(wrapper, 0)

      for (const [index, digit] of ['1', '2', '3'].entries()) {
        await fields(wrapper)[index].setValue(digit)
      }
      expect(wrapper.emitted('complete')).toBeUndefined()

      await fields(wrapper)[3].setValue('4')

      expect(wrapper.emitted('complete')).toEqual([['1234']])
    })

    it('emits validation after each input', async () => {
      const wrapper = mountOtp({ length: 4 })
      await focusField(wrapper, 0)

      await fields(wrapper)[0].setValue('1')

      expect(wrapper.emitted('validation')).toBeDefined()
    })
  })

  describe('keyboard', () => {
    it('Backspace on an empty input moves focus to the previous one', async () => {
      const wrapper = mountOtp({ modelValue: '1' })
      await focusField(wrapper, 1)

      await fields(wrapper)[1].trigger('keydown', { key: 'Backspace' })

      expect(document.activeElement).toBe(fields(wrapper)[0].element)
    })

    it('Backspace on a filled input keeps focus where it is', async () => {
      const wrapper = mountOtp({ modelValue: '12' })
      await focusField(wrapper, 1)

      await fields(wrapper)[1].trigger('keydown', { key: 'Backspace' })

      expect(document.activeElement).toBe(fields(wrapper)[1].element)
    })

    it('Backspace on the first input does nothing special', async () => {
      const wrapper = mountOtp()
      await focusField(wrapper, 0)

      await fields(wrapper)[0].trigger('keydown', { key: 'Backspace' })

      expect(document.activeElement).toBe(fields(wrapper)[0].element)
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('Shift+Backspace clears every input and focuses the first one', async () => {
      const wrapper = mountOtp({ modelValue: '1234' })
      await focusField(wrapper, 3)

      await fields(wrapper)[3].trigger('keydown', { key: 'Backspace', shiftKey: true })

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([''])
      expect(values(wrapper).every((v) => v === '')).toBe(true)
      expect(document.activeElement).toBe(fields(wrapper)[0].element)
      expect(wrapper.emitted('validation')).toBeDefined()
    })

    it('Shift+Delete clears every input and focuses the first one', async () => {
      const wrapper = mountOtp({ modelValue: '1234' })
      await focusField(wrapper, 2)

      await fields(wrapper)[2].trigger('keydown', { key: 'Delete', shiftKey: true })

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([''])
      expect(document.activeElement).toBe(fields(wrapper)[0].element)
    })

    it('ArrowLeft and ArrowRight move focus between inputs', async () => {
      const wrapper = mountOtp({ length: 3 })
      await focusField(wrapper, 1)

      await fields(wrapper)[1].trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(fields(wrapper)[2].element)

      await fields(wrapper)[2].trigger('keydown', { key: 'ArrowRight' })
      expect(document.activeElement).toBe(fields(wrapper)[2].element)

      await fields(wrapper)[2].trigger('keydown', { key: 'ArrowLeft' })
      expect(document.activeElement).toBe(fields(wrapper)[1].element)

      await fields(wrapper)[1].trigger('keydown', { key: 'ArrowLeft' })
      await fields(wrapper)[0].trigger('keydown', { key: 'ArrowLeft' })
      expect(document.activeElement).toBe(fields(wrapper)[0].element)
    })
  })

  describe('paste', () => {
    it('fills every input and emits complete for a full code', async () => {
      const wrapper = mountOtp()
      await focusField(wrapper, 0)

      const event = paste(fields(wrapper)[0].element, '123456')
      await nextTick()

      expect(event.defaultPrevented).toBe(true)
      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['123456'])
      expect(wrapper.emitted('complete')).toEqual([['123456']])
      expect(values(wrapper)).toEqual(['1', '2', '3', '4', '5', '6'])
    })

    it('truncates pasted text longer than the length', async () => {
      const wrapper = mountOtp({ length: 4 })
      await focusField(wrapper, 0)

      paste(fields(wrapper)[0].element, '987654321')
      await nextTick()

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['9876'])
      expect(wrapper.emitted('complete')).toEqual([['9876']])
    })

    it('fills what it can for a partial code and focuses the next empty input', async () => {
      const wrapper = mountOtp()
      await focusField(wrapper, 0)

      paste(fields(wrapper)[0].element, '12')
      await nextTick()

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['12'])
      expect(wrapper.emitted('complete')).toBeUndefined()
      expect(document.activeElement).toBe(fields(wrapper)[2].element)
    })

    it('focuses the last input after a full paste', async () => {
      const wrapper = mountOtp({ length: 4 })
      await focusField(wrapper, 0)

      paste(fields(wrapper)[0].element, '1234')
      await nextTick()

      expect(document.activeElement).toBe(fields(wrapper)[3].element)
    })

    it('overwrites the leading characters and keeps the rest of the current value', async () => {
      const wrapper = mountOtp({ modelValue: '123456' })
      await focusField(wrapper, 0)

      paste(fields(wrapper)[0].element, '99')
      await nextTick()

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['993456'])
    })

    it('strips whitespace from pasted text', async () => {
      const wrapper = mountOtp()
      await focusField(wrapper, 0)

      paste(fields(wrapper)[0].element, '123 456')
      await nextTick()

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual(['123456'])
    })
  })

  describe('validation', () => {
    it('reports an incomplete code on blur when required', async () => {
      const wrapper = mountOtp({ required: true, length: 4 })
      await focusField(wrapper, 0)

      fields(wrapper)[0].element.blur()
      await nextTick()

      expect(wrapper.emitted('validation')).toEqual([
        [{ valid: false, error: 'Please enter the complete code' }],
      ])
      expect(wrapper.find('.base-otp__helper').text()).toBe('Please enter the complete code')
      expect(wrapper.find('.base-otp__helper').classes()).toContain('base-otp__helper--error')
      expect(wrapper.classes()).toContain('base-otp--error')
      expect(wrapper.find('.base-otp__instructions').exists()).toBe(false)
    })

    it('reports a partial code on blur when optional', async () => {
      const wrapper = mountOtp({ modelValue: '12', length: 4 })
      await focusField(wrapper, 0)

      fields(wrapper)[0].element.blur()
      await nextTick()

      expect(wrapper.emitted('validation')).toEqual([
        [{ valid: false, error: 'Please complete the code or leave it empty' }],
      ])
    })

    it('accepts an empty optional code and a complete code', async () => {
      const empty = mountOtp({ length: 4 })
      await focusField(empty, 0)
      fields(empty)[0].element.blur()
      await nextTick()
      expect(empty.emitted('validation')).toEqual([[{ valid: true, error: '' }]])

      const complete = mountOtp({ modelValue: '1234', length: 4, required: true })
      await focusField(complete, 0)
      fields(complete)[0].element.blur()
      await nextTick()
      expect(complete.emitted('validation')).toEqual([[{ valid: true, error: '' }]])
      expect(complete.classes()).not.toContain('base-otp--error')
    })

    it('uses the errorMessage prop instead of the built-in message', async () => {
      const wrapper = mountOtp({ required: true, errorMessage: 'Wrong code' })
      await focusField(wrapper, 0)

      fields(wrapper)[0].element.blur()
      await nextTick()

      expect(wrapper.emitted('validation')).toEqual([[{ valid: false, error: 'Wrong code' }]])
    })

    it('clears the error when the model value is reset to empty', async () => {
      const wrapper = mountOtp({ required: true, length: 4 })
      await wrapper.setProps({ modelValue: '12' })
      expect(wrapper.find('.base-otp__helper--error').exists()).toBe(true)

      await wrapper.setProps({ modelValue: '' })

      expect(wrapper.find('.base-otp__helper').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('base-otp--error')
    })

    it('does not show a validation error while the user is still typing', async () => {
      const wrapper = mountOtp({ required: true, length: 4 })
      await focusField(wrapper, 0)

      await fields(wrapper)[0].setValue('1')

      expect(wrapper.find('.base-otp__helper--error').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('base-otp--error')
    })
  })

  describe('mounted payload', () => {
    it('emits mounted once with validate, focus and reset', () => {
      const wrapper = mountOtp()
      const payload = mountedPayload(wrapper)

      expect(wrapper.emitted('mounted')).toHaveLength(1)
      expect(typeof payload.validate).toBe('function')
      expect(typeof payload.focus).toBe('function')
      expect(typeof payload.reset).toBe('function')
    })

    it('validate() returns the validity and surfaces the error', async () => {
      const wrapper = mountOtp({ required: true, length: 4 })
      const payload = mountedPayload(wrapper)

      expect(payload.validate()).toBe(false)
      await nextTick()
      expect(wrapper.find('.base-otp__helper').text()).toBe('Please enter the complete code')

      const valid = mountOtp({ modelValue: '1234', length: 4, required: true })
      expect(mountedPayload(valid).validate()).toBe(true)
    })

    it('reset() clears the value and the error', async () => {
      const wrapper = mountOtp({ modelValue: '12', required: true, length: 4 })
      await wrapper.setProps({ modelValue: '12' })
      const payload = mountedPayload(wrapper)
      payload.validate()
      await nextTick()
      expect(wrapper.find('.base-otp__helper--error').exists()).toBe(true)

      payload.reset()
      await nextTick()

      expect(emittedValues(wrapper, 'update:modelValue')).toEqual([''])
      expect(wrapper.find('.base-otp__helper').exists()).toBe(false)
    })

    it('focus() focuses the first input once the component has re-rendered', async () => {
      const wrapper = mountOtp({ label: 'Code' })
      await wrapper.setProps({ label: 'Code 2' })

      mountedPayload(wrapper).focus()

      expect(document.activeElement).toBe(fields(wrapper)[0].element)
    })
  })

  describe('autoFocus', () => {
    it('focuses the first input shortly after mount', async () => {
      const wrapper = mountOtp({ autoFocus: true })

      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(document.activeElement).toBe(fields(wrapper)[0].element)
    })

    it('does not focus anything on mount without autoFocus', async () => {
      mountOtp()

      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(document.activeElement).toBe(document.body)
    })
  })

  describe('known defects', () => {
    it('focus() from the mounted payload focuses the first input immediately', () => {
      const wrapper = mountOtp()

      mountedPayload(wrapper).focus()

      expect(document.activeElement).toBe(fields(wrapper)[0].element)
    })

    // BUG: typing in box 3 while boxes 1-2 are empty collapses the value into box 1
    it.fails('keeps a character in the box where it was typed', async () => {
      const wrapper = mountOtp({ length: 4 })
      await focusField(wrapper, 2)

      await fields(wrapper)[2].setValue('5')

      expect(values(wrapper)).toEqual(['', '', '5', ''])
    })

    it('does not clear the code with Shift+Backspace when readonly', async () => {
      const wrapper = mountOtp({ modelValue: '1234', length: 4, readonly: true })

      await fields(wrapper)[0].trigger('keydown', { key: 'Backspace', shiftKey: true })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('ignores paste when readonly', async () => {
      const wrapper = mountOtp({ length: 4, readonly: true })

      paste(fields(wrapper)[0].element, '1234')
      await nextTick()

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    // BUG: type=number renders <input type="number"> (maxlength ignored) instead of text + inputmode numeric
    it.fails('renders numeric OTP as a text input with inputmode numeric', () => {
      const wrapper = mountOtp({ type: 'number' })
      const first = fields(wrapper)[0]

      expect(first.attributes('type')).toBe('text')
      expect(first.attributes('inputmode')).toBe('numeric')
    })
  })
})

describe('BaseOTP when the validation error is shown', () => {
  it('still reports an incomplete code through the validation event while typing', async () => {
    const wrapper = mountOtp({ required: true, length: 4 })
    await focusField(wrapper, 0)

    await fields(wrapper)[0].setValue('1')

    expect(wrapper.emitted('validation')?.at(-1)).toEqual([
      { valid: false, error: 'Please enter the complete code' },
    ])
    expect(wrapper.classes()).not.toContain('base-otp--error')
  })

  it('does not validate when focus only moves to another box of the same field', async () => {
    const wrapper = mountOtp({ required: true, length: 4 })
    await focusField(wrapper, 0)
    await fields(wrapper)[0].setValue('1')

    fields(wrapper)[0].element.dispatchEvent(
      new FocusEvent('blur', { relatedTarget: fields(wrapper)[1].element }),
    )
    await nextTick()

    expect(wrapper.classes()).not.toContain('base-otp--error')
  })

  it('shows the error when focus leaves the field with an incomplete code', async () => {
    const wrapper = mountOtp({ required: true, length: 4 })
    await focusField(wrapper, 0)
    await fields(wrapper)[0].setValue('1')

    await fields(wrapper)[0].trigger('blur')

    expect(wrapper.classes()).toContain('base-otp--error')
  })

  it('keeps an error that is already shown up to date while the user keeps typing', async () => {
    const wrapper = mountOtp({ required: true, length: 4 })
    await focusField(wrapper, 0)
    await fields(wrapper)[0].setValue('1')
    await fields(wrapper)[0].trigger('blur')
    expect(wrapper.classes()).toContain('base-otp--error')

    await focusField(wrapper, 1)
    for (const [index, digit] of ['2', '3', '4'].entries()) {
      await fields(wrapper)[index + 1].setValue(digit)
    }

    expect(wrapper.classes()).not.toContain('base-otp--error')
  })
})
