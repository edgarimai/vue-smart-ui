import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { BaseInput, useValidationConfig } from '../../src'

type InputProps = InstanceType<typeof BaseInput>['$props']
type Rules = NonNullable<InputProps['rules']>

interface ValidationPayload {
  valid: boolean
  error: string
  name?: string
}

interface MountedPayload {
  validate: () => boolean
  focus: () => void
}

interface MountOptions {
  slots?: Record<string, string>
  attachTo?: HTMLElement
}

const mountInput = (props: InputProps = {}, options: MountOptions = {}) =>
  mount(BaseInput, { props, ...options })

type InputWrapper = ReturnType<typeof mountInput>

// Mounts with a minimal v-model binding so the display value follows what the input emits.
function mountVModel(props: InputProps = {}): InputWrapper {
  const wrapper: InputWrapper = mount(BaseInput, {
    props: {
      ...props,
      'onUpdate:modelValue': (value: string | number) => {
        void wrapper.setProps({ modelValue: value })
      },
    },
  })
  return wrapper
}

const emittedArgs = (wrapper: InputWrapper, name: string): unknown[][] =>
  wrapper.emitted(name) ?? []

const modelUpdates = (wrapper: InputWrapper): unknown[] =>
  emittedArgs(wrapper, 'update:modelValue').map((args) => args[0])

const validations = (wrapper: InputWrapper): ValidationPayload[] =>
  emittedArgs(wrapper, 'validation').map((args) => args[0] as ValidationPayload)

const lastValidation = (wrapper: InputWrapper): ValidationPayload | undefined =>
  validations(wrapper).at(-1)

const mountedApi = (wrapper: InputWrapper): MountedPayload =>
  emittedArgs(wrapper, 'mounted')[0][0] as MountedPayload

const typeInto = (wrapper: InputWrapper, value: string) => wrapper.get('input').setValue(value)

const blur = (wrapper: InputWrapper) => wrapper.get('input').trigger('blur')

const displayed = (wrapper: InputWrapper): string => wrapper.get('input').element.value

// Intl pt-BR currency output uses a non-breaking space after the symbol.
const plain = (text: string): string => text.replace(/ /g, ' ')

const helperText = (wrapper: InputWrapper): string | undefined => {
  const helper = wrapper.find('.base-input__helper')
  return helper.exists() ? helper.text() : undefined
}

enableAutoUnmount(afterEach)

const { setValidationMessages, resetValidationMessages } = useValidationConfig()

afterEach(() => {
  resetValidationMessages()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('BaseInput rendering', () => {
  it('renders an input with the base classes and the default props', () => {
    const wrapper = mountInput()
    const input = wrapper.get('input')

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['vsui', 'base-input', 'base-input--default']),
    )
    expect(input.classes()).toContain('base-input__field')
    expect(input.attributes('type')).toBe('text')
    expect(input.element.value).toBe('')
    expect(wrapper.find('label').exists()).toBe(false)
    expect(wrapper.find('.base-input__helper').exists()).toBe(false)
    expect(wrapper.find('.base-input__prefix').exists()).toBe(false)
    expect(wrapper.find('.base-input__suffix').exists()).toBe(false)
  })

  it('uses the id prop on the input and generates one otherwise', () => {
    expect(mountInput({ id: 'my-input' }).get('input').attributes('id')).toBe('my-input')
    expect(mountInput().get('input').attributes('id')).toMatch(/^input-\d+$/)
  })

  it.each(['filled', 'outlined'] as const)('applies the %s variant class', (variant) => {
    expect(mountInput({ variant }).classes()).toContain(`base-input--${variant}`)
  })

  it('applies the transparent wrapper modifier', () => {
    const wrapper = mountInput({ transparentBg: true })

    expect(wrapper.get('.base-input__wrapper').classes()).toContain(
      'base-input__wrapper--transparent',
    )
  })

  it('renders the label, placeholder, type, readonly and min/max attributes', () => {
    const wrapper = mountInput({
      label: 'Quantity',
      placeholder: 'How many?',
      type: 'number',
      readonly: true,
      min: 1,
      max: 10,
    })
    const input = wrapper.get('input')

    expect(wrapper.get('label.base-input__label').text()).toBe('Quantity')
    expect(input.attributes('placeholder')).toBe('How many?')
    expect(input.attributes('type')).toBe('number')
    expect(input.element.readOnly).toBe(true)
    expect(input.attributes('min')).toBe('1')
    expect(input.attributes('max')).toBe('10')
  })

  it('disables the input and applies the disabled class', () => {
    const wrapper = mountInput({ disabled: true })

    expect(wrapper.get('input').element.disabled).toBe(true)
    expect(wrapper.classes()).toContain('base-input--disabled')
  })

  it('forwards non-prop attributes and classes to the root element', () => {
    const wrapper = mount(BaseInput, {
      attrs: { 'data-testid': 'field', class: 'custom' },
    })

    expect(wrapper.attributes('data-testid')).toBe('field')
    expect(wrapper.classes()).toContain('custom')
    expect(wrapper.get('input').attributes('data-testid')).toBeUndefined()
  })

  describe('required marker', () => {
    it('shows the asterisk and required attributes when the required prop is set', () => {
      const wrapper = mountInput({ label: 'Name', required: true })
      const input = wrapper.get('input')

      expect(wrapper.get('.base-input__required').text()).toBe('*')
      expect(input.element.required).toBe(true)
      expect(input.attributes('aria-required')).toBe('true')
    })

    it('shows the asterisk when a required rule is configured', () => {
      expect(
        mountInput({ label: 'Name', rules: ['required'] })
          .find('.base-input__required')
          .exists(),
      ).toBe(true)
      expect(
        mountInput({ label: 'Name', rules: [{ required: true }] })
          .find('.base-input__required')
          .exists(),
      ).toBe(true)
    })

    it('does not show the asterisk otherwise', () => {
      const wrapper = mountInput({ label: 'Name', rules: ['email'] })

      expect(wrapper.find('.base-input__required').exists()).toBe(false)
      expect(wrapper.get('input').element.required).toBe(false)
      expect(wrapper.get('input').attributes('aria-required')).toBe('false')
    })
  })

  describe('prefix and suffix', () => {
    it('renders the prefix slot', () => {
      const wrapper = mountInput({}, { slots: { prefix: '<span class="pfx">$</span>' } })

      expect(wrapper.get('.base-input__prefix .pfx').text()).toBe('$')
      expect(wrapper.classes()).toContain('base-input--with-prefix')
    })

    it('renders the suffix slot', () => {
      const wrapper = mountInput({}, { slots: { suffix: '<span class="sfx">kg</span>' } })

      expect(wrapper.get('.base-input__suffix .sfx').text()).toBe('kg')
      expect(wrapper.classes()).toContain('base-input--with-suffix')
    })

    it('renders icons from prefixIcon and suffixIcon', () => {
      const wrapper = mountInput({ prefixIcon: 'icon-user', suffixIcon: 'icon-check' })

      expect(wrapper.get('.base-input__prefix i').classes()).toContain('icon-user')
      expect(wrapper.get('.base-input__suffix i').classes()).toContain('icon-check')
      expect(wrapper.classes()).toEqual(
        expect.arrayContaining(['base-input--with-prefix', 'base-input--with-suffix']),
      )
    })

    it('lets the slots replace the icons', () => {
      const wrapper = mountInput(
        { prefixIcon: 'icon-user', suffixIcon: 'icon-check' },
        { slots: { prefix: '<b class="pfx" />', suffix: '<b class="sfx" />' } },
      )

      expect(wrapper.find('.base-input__prefix i').exists()).toBe(false)
      expect(wrapper.find('.base-input__suffix i').exists()).toBe(false)
      expect(wrapper.find('.pfx').exists()).toBe(true)
      expect(wrapper.find('.sfx').exists()).toBe(true)
    })
  })

  describe('state and helper messages', () => {
    it.each(['success', 'error', 'warning'] as const)('applies the %s state class', (state) => {
      expect(mountInput({ state }).classes()).toContain(`base-input--${state}`)
    })

    it('renders the helper text without the error modifier', () => {
      const wrapper = mountInput({ helperText: 'Use your legal name' })

      expect(helperText(wrapper)).toBe('Use your legal name')
      expect(wrapper.get('.base-input__helper').classes()).not.toContain(
        'base-input__helper--error',
      )
    })

    it('prefers errorMessage over helperText without switching to the error state', () => {
      const wrapper = mountInput({ helperText: 'Hint', errorMessage: 'Server said no' })

      expect(helperText(wrapper)).toBe('Server said no')
      expect(wrapper.classes()).not.toContain('base-input--error')
      expect(wrapper.get('.base-input__helper').classes()).not.toContain(
        'base-input__helper--error',
      )
    })
  })
})

describe('BaseInput events and v-model', () => {
  it('shows the modelValue, including numbers, and follows prop updates', async () => {
    const wrapper = mountInput({ modelValue: 'hello' })

    expect(displayed(wrapper)).toBe('hello')

    await wrapper.setProps({ modelValue: 42 })
    expect(displayed(wrapper)).toBe('42')
  })

  it('emits update:modelValue with the typed value', async () => {
    const wrapper = mountInput()

    await typeInto(wrapper, 'abc')

    expect(modelUpdates(wrapper)).toEqual(['abc'])
  })

  it('works with v-model on a parent', async () => {
    const model = ref('start')
    const Parent = defineComponent({
      setup: () => () =>
        h(BaseInput, {
          modelValue: model.value,
          'onUpdate:modelValue': (value: string | number) => {
            model.value = String(value)
          },
        }),
    })
    const wrapper = mount(Parent)

    expect(wrapper.get('input').element.value).toBe('start')

    await wrapper.get('input').setValue('next')
    expect(model.value).toBe('next')
  })

  it('emits input once per native input event', async () => {
    const wrapper = mountInput()

    await typeInto(wrapper, 'a')

    // The payload is a synthetic copy of the event, so only the emission itself is stable.
    expect(emittedArgs(wrapper, 'input')).toHaveLength(1)
  })

  it('emits focus and blur and toggles the focused class', async () => {
    const wrapper = mountInput()
    const input = wrapper.get('input')

    await input.trigger('focus')
    expect(emittedArgs(wrapper, 'focus')).toHaveLength(1)
    expect(wrapper.classes()).toContain('base-input--focused')

    await input.trigger('blur')
    expect(emittedArgs(wrapper, 'blur')).toHaveLength(1)
    expect(wrapper.classes()).not.toContain('base-input--focused')
  })

  it('emits enter on the enter key only', async () => {
    const wrapper = mountInput()
    const input = wrapper.get('input')

    await input.trigger('keydown', { key: 'a' })
    expect(emittedArgs(wrapper, 'enter')).toHaveLength(0)

    await input.trigger('keydown.enter')
    expect(emittedArgs(wrapper, 'enter')).toHaveLength(1)
  })

  it('lowercases the emitted value for type="email"', async () => {
    const wrapper = mountInput({ type: 'email' })

    await typeInto(wrapper, 'John@Example.COM')

    expect(modelUpdates(wrapper)).toEqual(['john@example.com'])
  })
})

describe('BaseInput case transforms', () => {
  it('uppercases what is typed and emitted', async () => {
    const wrapper = mountInput({ uppercase: true })

    await typeInto(wrapper, 'abc')

    expect(modelUpdates(wrapper)).toEqual(['ABC'])
    expect(displayed(wrapper)).toBe('ABC')
  })

  it('lowercases what is typed and emitted', async () => {
    const wrapper = mountInput({ lowercase: true })

    await typeInto(wrapper, 'ABC')

    expect(modelUpdates(wrapper)).toEqual(['abc'])
    expect(displayed(wrapper)).toBe('abc')
  })

  it('displays the modelValue transformed without changing the prop', () => {
    expect(displayed(mountInput({ modelValue: 'abc', uppercase: true }))).toBe('ABC')
    expect(displayed(mountInput({ modelValue: 'ABC', lowercase: true }))).toBe('abc')
  })
})

describe('BaseInput password toggle', () => {
  it('only renders the toggle for type="password"', () => {
    expect(mountInput().find('.base-input__password-toggle').exists()).toBe(false)

    const wrapper = mountInput({ type: 'password' })
    expect(wrapper.find('.base-input__password-toggle').exists()).toBe(true)
    expect(wrapper.classes()).toContain('base-input--with-suffix')
  })

  it('switches between password and text on click', async () => {
    vi.useFakeTimers()
    const wrapper = mountInput({ type: 'password', modelValue: 'secret' })
    const input = wrapper.get('input')
    const toggle = wrapper.get('.base-input__password-toggle')

    expect(input.attributes('type')).toBe('password')
    expect(toggle.attributes('type')).toBe('button')
    expect(toggle.attributes('aria-label')).toBe('Show password')

    await toggle.trigger('click')
    expect(input.attributes('type')).toBe('text')
    expect(toggle.attributes('aria-label')).toBe('Hide password')

    await toggle.trigger('click')
    expect(input.attributes('type')).toBe('password')
    expect(toggle.attributes('aria-label')).toBe('Show password')

    vi.runAllTimers()
  })

  it('keeps the cursor position after toggling', async () => {
    vi.useFakeTimers()
    const wrapper = mountInput({ type: 'password', modelValue: 'secret' })
    const input = wrapper.get('input')

    input.element.setSelectionRange(2, 2)
    await wrapper.get('.base-input__password-toggle').trigger('click')
    vi.advanceTimersByTime(50)

    expect(input.element.selectionStart).toBe(2)
    expect(input.element.selectionEnd).toBe(2)
  })

  it('renders the suffix slot alongside the toggle', () => {
    const wrapper = mountInput(
      { type: 'password' },
      { slots: { suffix: '<span class="sfx">!</span>' } },
    )

    expect(wrapper.find('.base-input__suffix .sfx').exists()).toBe(true)
    expect(wrapper.find('.base-input__password-toggle').exists()).toBe(true)
  })
})

describe('BaseInput masks', () => {
  it.each([
    ['cpf', '12345678901', '123.456.789-01', '12345678901'],
    ['cnpj', '12345678000195', '12.345.678/0001-95', '12345678000195'],
    ['cep', '01310100', '01310-100', '01310100'],
    ['phone', '1198765432', '(11) 9876-5432', '1198765432'],
    ['phone', '11987654321', '(11) 98765-4321', '11987654321'],
    ['###-AAA', '123abc', '123-abc', '123abc'],
  ])(
    'mask "%s" formats %s for display and emits the raw value',
    async (mask, typed, shown, raw) => {
      const wrapper = mountVModel({ mask })

      await typeInto(wrapper, typed)

      expect(displayed(wrapper)).toBe(shown)
      expect(modelUpdates(wrapper)).toEqual([raw])
    },
  )

  it('strips non-digits when typing into a masked field', async () => {
    const wrapper = mountVModel({ mask: 'cpf' })

    await typeInto(wrapper, '123.456.789-01')

    expect(displayed(wrapper)).toBe('123.456.789-01')
    expect(modelUpdates(wrapper)).toEqual(['12345678901'])
  })

  it('formats a raw modelValue for display', () => {
    expect(displayed(mountInput({ mask: 'cpf', modelValue: '12345678901' }))).toBe('123.456.789-01')
    expect(displayed(mountInput({ mask: 'cep', modelValue: '01310100' }))).toBe('01310-100')
  })

  it('reformats the display when the modelValue changes', async () => {
    const wrapper = mountInput({ mask: 'cpf', modelValue: '' })

    await wrapper.setProps({ modelValue: '12345678901' })
    await nextTick()

    expect(displayed(wrapper)).toBe('123.456.789-01')
  })

  it('emits the masked string when rawValue is false', async () => {
    const wrapper = mountInput({ mask: 'cpf', rawValue: false })

    await typeInto(wrapper, '12345678901')

    expect(modelUpdates(wrapper)).toEqual(['123.456.789-01'])
    expect(displayed(wrapper)).toBe('123.456.789-01')
  })

  it('shows an already masked modelValue untouched when rawValue is false', () => {
    const wrapper = mountInput({ mask: 'cpf', rawValue: false, modelValue: '123.456.789-01' })

    expect(displayed(wrapper)).toBe('123.456.789-01')
  })

  it.each([
    ['cpf', '14'],
    ['cnpj', '18'],
    ['cep', '9'],
    ['phone', '15'],
    ['date', '10'],
    ['###-###', '7'],
  ])('mask "%s" sets maxlength to %s', (mask, maxlength) => {
    expect(mountInput({ mask }).get('input').attributes('maxlength')).toBe(maxlength)
  })

  it('does not set maxlength without a mask or for the currency mask', () => {
    expect(mountInput().get('input').attributes('maxlength')).toBeUndefined()
    expect(mountInput({ mask: 'currency' }).get('input').attributes('maxlength')).toBeUndefined()
  })

  it('supports a custom mask with several patterns', async () => {
    const wrapper = mountVModel({
      mask: {
        patterns: ['###-###', '####-####'],
        match: (value: string) => (value.replace(/\D/g, '').length <= 6 ? 0 : 1),
      },
    })

    expect(wrapper.get('input').attributes('maxlength')).toBe('9')

    await typeInto(wrapper, '123456')
    expect(displayed(wrapper)).toBe('123-456')

    await typeInto(wrapper, '12345678')
    expect(displayed(wrapper)).toBe('1234-5678')
    expect(modelUpdates(wrapper)).toEqual(['123456', '12345678'])
  })

  it('uppercases masked letters for display when uppercase is set', async () => {
    const wrapper = mountVModel({ mask: '###-AAA', uppercase: true })

    await typeInto(wrapper, '123abc')

    expect(displayed(wrapper)).toBe('123-ABC')
  })

  describe('currency', () => {
    it('formats typed digits as BRL and emits a number', async () => {
      const wrapper = mountVModel({ mask: 'currency' })

      await typeInto(wrapper, '123456')

      expect(plain(displayed(wrapper))).toBe('R$ 1.234,56')
      expect(modelUpdates(wrapper)).toEqual([1234.56])
    })

    it('treats every typed digit as cents', async () => {
      const wrapper = mountVModel({ mask: 'currency' })

      await typeInto(wrapper, '5')

      expect(plain(displayed(wrapper))).toBe('R$ 0,05')
      expect(modelUpdates(wrapper)).toEqual([0.05])
    })

    it('ignores the symbol and separators already in the text', async () => {
      const wrapper = mountVModel({ mask: 'currency' })

      await typeInto(wrapper, 'R$ 12,34')

      expect(modelUpdates(wrapper)).toEqual([12.34])
    })

    it('formats a numeric modelValue, including zero', () => {
      expect(plain(displayed(mountInput({ mask: 'currency', modelValue: 1500.5 })))).toBe(
        'R$ 1.500,50',
      )
      expect(plain(displayed(mountInput({ mask: 'currency', modelValue: 0 })))).toBe('R$ 0,00')
    })

    it('shows an empty field for an empty modelValue', () => {
      expect(displayed(mountInput({ mask: 'currency', modelValue: '' }))).toBe('')
    })

    it('emits the formatted string when rawValue is false', async () => {
      const wrapper = mountInput({ mask: 'currency', rawValue: false })

      await typeInto(wrapper, '123456')

      const [payload] = modelUpdates(wrapper)
      expect(plain(String(payload))).toBe('R$ 1.234,56')
    })
  })

  describe('date', () => {
    it('shows DD/MM/YYYY and emits YYYY-MM-DD by default', async () => {
      const wrapper = mountVModel({ mask: 'date' })

      await typeInto(wrapper, '25122024')

      expect(displayed(wrapper)).toBe('25/12/2024')
      expect(modelUpdates(wrapper)).toEqual(['2024-12-25'])
    })

    it('emits the raw digits while the date is incomplete', async () => {
      const wrapper = mountVModel({ mask: 'date' })

      await typeInto(wrapper, '2512')

      expect(displayed(wrapper)).toBe('25/12')
      expect(modelUpdates(wrapper)).toEqual(['2512'])
    })

    it('converts a modelValue in the value format to the display format', () => {
      expect(displayed(mountInput({ mask: 'date', modelValue: '2024-12-25' }))).toBe('25/12/2024')
    })

    it('honors dateDisplayFormat', async () => {
      const wrapper = mountVModel({ mask: 'date', dateDisplayFormat: 'MM/DD/YYYY' })

      await typeInto(wrapper, '12252024')

      expect(displayed(wrapper)).toBe('12/25/2024')
      expect(modelUpdates(wrapper)).toEqual(['2024-12-25'])
    })

    it('honors dateValueFormat', async () => {
      const wrapper = mountVModel({
        mask: 'date',
        dateDisplayFormat: 'YYYY-MM-DD',
        dateValueFormat: 'DD/MM/YYYY',
      })

      await typeInto(wrapper, '20241225')

      expect(displayed(wrapper)).toBe('2024-12-25')
      expect(modelUpdates(wrapper)).toEqual(['25/12/2024'])
    })

    it('emits the displayed string when rawValue is false', async () => {
      const wrapper = mountInput({ mask: 'date', rawValue: false })

      await typeInto(wrapper, '25122024')

      expect(modelUpdates(wrapper)).toEqual(['25/12/2024'])
    })
  })
})

describe('BaseInput validation', () => {
  describe('built-in rules', () => {
    const cases: Array<{
      name: string
      rules: Rules
      invalid: string
      valid: string
      message: string
    }> = [
      {
        name: 'required',
        rules: ['required'],
        invalid: '   ',
        valid: 'x',
        message: 'This field is required',
      },
      {
        name: '{ required: true }',
        rules: [{ required: true }],
        invalid: '',
        valid: 'x',
        message: 'This field is required',
      },
      {
        name: 'email',
        rules: ['email'],
        invalid: 'not-an-email',
        valid: 'a@b.co',
        message: 'Please enter a valid email',
      },
      {
        name: '{ min }',
        rules: [{ min: 3 }],
        invalid: 'ab',
        valid: 'abc',
        message: 'Must be at least 3 characters',
      },
      {
        name: '{ max }',
        rules: [{ max: 3 }],
        invalid: 'abcd',
        valid: 'abc',
        message: 'Must be no more than 3 characters',
      },
      {
        name: '{ pattern }',
        rules: [{ pattern: '^[0-9]+$' }],
        invalid: 'abc',
        valid: '123',
        message: 'Invalid format',
      },
      {
        name: '{ minValue }',
        rules: [{ minValue: 5 }],
        invalid: '3',
        valid: '10',
        message: 'Value must be at least 5',
      },
      {
        name: '{ maxValue }',
        rules: [{ maxValue: 5 }],
        invalid: '10',
        valid: '3',
        message: 'Value must be no more than 5',
      },
      {
        name: 'hexColor',
        rules: ['hexColor'],
        invalid: 'red',
        valid: '#ff0000',
        message: 'Invalid HEX color',
      },
      {
        name: '{ hexColor: true }',
        rules: [{ hexColor: true }],
        invalid: '#12',
        valid: '#fff',
        message: 'Invalid HEX color',
      },
      {
        name: 'rgbColor',
        rules: ['rgbColor'],
        invalid: 'rgb(1,2)',
        valid: 'rgb(255, 0, 10)',
        message: 'Invalid RGB color',
      },
      {
        name: 'rgbaColor',
        rules: ['rgbaColor'],
        invalid: 'rgba(1,2,3)',
        valid: 'rgba(255, 0, 10, 0.5)',
        message: 'Invalid RGBA color',
      },
      {
        name: 'hslColor',
        rules: ['hslColor'],
        invalid: 'hsl(1,2,3)',
        valid: 'hsl(120, 50%, 50%)',
        message: 'Invalid HSL color',
      },
    ]

    it.each(cases)(
      '$name rejects an invalid value on blur',
      async ({ rules, invalid, message }) => {
        const wrapper = mountVModel({ rules })

        await typeInto(wrapper, invalid)
        await blur(wrapper)

        expect(lastValidation(wrapper)).toStrictEqual({ valid: false, error: message })
        expect(helperText(wrapper)).toBe(message)
      },
    )

    it.each(cases)('$name accepts a valid value on blur', async ({ rules, valid }) => {
      const wrapper = mountVModel({ rules })

      await typeInto(wrapper, valid)
      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
      expect(helperText(wrapper)).toBeUndefined()
    })

    it('lets optional rules pass on an empty value', async () => {
      const wrapper = mountVModel({
        rules: ['email', { min: 3 }, { pattern: '^x$' }, 'hexColor', { minValue: 1 }],
      })

      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
    })

    it('reports the first failing rule', async () => {
      const wrapper = mountVModel({ rules: ['required', 'email'] })

      await blur(wrapper)
      expect(lastValidation(wrapper)?.error).toBe('This field is required')

      await typeInto(wrapper, 'nope')
      await blur(wrapper)
      expect(lastValidation(wrapper)?.error).toBe('Please enter a valid email')
    })

    it('ignores unknown string rules', async () => {
      const wrapper = mountVModel({ rules: ['unknown'], modelValue: 'x' })

      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
    })

    it('validates numeric strings against minValue and maxValue', async () => {
      const wrapper = mountVModel({ rules: [{ minValue: 1 }], modelValue: '0' })

      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({
        valid: false,
        error: 'Value must be at least 1',
      })
    })
  })

  describe('custom rules and messages', () => {
    it('runs a custom validator and uses its message', async () => {
      const validator = vi.fn((value: unknown) => value === 'ok')
      const wrapper = mountVModel({ rules: [{ validator, message: 'Must be ok' }] })

      await typeInto(wrapper, 'nope')
      await blur(wrapper)

      expect(validator).toHaveBeenCalledWith('nope')
      expect(lastValidation(wrapper)).toStrictEqual({ valid: false, error: 'Must be ok' })

      await typeInto(wrapper, 'ok')
      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
    })

    it('accepts the message before the validator in the rule object', async () => {
      const wrapper = mountVModel({ rules: [{ message: 'Always bad', validator: () => false }] })

      await blur(wrapper)

      expect(lastValidation(wrapper)?.error).toBe('Always bad')
    })

    it('falls back to "Invalid value" for a custom validator without a message', async () => {
      const wrapper = mountVModel({ rules: [{ validator: () => false }] })

      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({ valid: false, error: 'Invalid value' })
    })

    it('overrides a built-in message when the rule object has one after the rule key', async () => {
      const wrapper = mountVModel({ rules: [{ min: 5, message: 'Too short' }] })

      await typeInto(wrapper, 'abc')
      await blur(wrapper)

      expect(lastValidation(wrapper)?.error).toBe('Too short')
    })

    it('uses the messages configured through useValidationConfig', async () => {
      setValidationMessages({
        required: 'Obrigatório',
        min: (min) => `Mínimo de ${min} caracteres`,
      })
      const wrapper = mountVModel({ rules: ['required', { min: 3 }] })

      await blur(wrapper)
      expect(lastValidation(wrapper)?.error).toBe('Obrigatório')

      await typeInto(wrapper, 'ab')
      await blur(wrapper)
      expect(lastValidation(wrapper)?.error).toBe('Mínimo de 3 caracteres')
    })

    it('restores the default messages after a reset', async () => {
      setValidationMessages({ required: 'Obrigatório' })
      resetValidationMessages()
      const wrapper = mountVModel({ rules: ['required'] })

      await blur(wrapper)

      expect(lastValidation(wrapper)?.error).toBe('This field is required')
    })
  })

  describe('when validation runs', () => {
    it('validates on blur by default and emits { valid, error } without a name', async () => {
      const wrapper = mountVModel({ rules: ['required'], name: 'email' })

      await blur(wrapper)

      expect(validations(wrapper)).toStrictEqual([
        { valid: false, error: 'This field is required' },
      ])
    })

    it('emits a valid result on blur when there are no rules', async () => {
      const wrapper = mountVModel()

      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
    })

    it('does not validate on blur when validateOnBlur is false', async () => {
      const wrapper = mountVModel({ rules: ['required'], validateOnBlur: false })

      await blur(wrapper)

      expect(validations(wrapper)).toHaveLength(0)
      expect(wrapper.find('.base-input__helper').exists()).toBe(false)
    })

    it('does not validate while typing by default', async () => {
      const wrapper = mountVModel({ rules: [{ min: 3 }] })

      await typeInto(wrapper, 'a')

      expect(validations(wrapper)).toHaveLength(0)
    })

    it('validates while typing when validateOnInput is true', async () => {
      const wrapper = mountVModel({ rules: [{ min: 3 }], validateOnInput: true })

      await typeInto(wrapper, 'a')
      expect(lastValidation(wrapper)).toStrictEqual({
        valid: false,
        error: 'Must be at least 3 characters',
      })

      await typeInto(wrapper, 'abc')
      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
      expect(helperText(wrapper)).toBeUndefined()
    })

    it('validates the emitted raw value while typing into a masked field', async () => {
      const wrapper = mountVModel({ mask: 'cpf', rules: [{ max: 11 }], validateOnInput: true })

      await typeInto(wrapper, '12345678901')

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
    })

    it('re-validates on every input once it has been validated, even without validateOnInput', async () => {
      const wrapper = mountVModel({ rules: ['required'] })

      await blur(wrapper)
      expect(wrapper.classes()).toContain('base-input--error')

      await typeInto(wrapper, 'x')

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
      expect(wrapper.classes()).not.toContain('base-input--error')
    })
  })

  describe('error state rendering', () => {
    it('shows the error with the error classes and hides it once valid', async () => {
      const wrapper = mountVModel({ rules: ['required'], helperText: 'Hint' })

      await blur(wrapper)

      expect(wrapper.classes()).toContain('base-input--error')
      expect(wrapper.get('.base-input__helper').classes()).toContain('base-input__helper--error')
      expect(helperText(wrapper)).toBe('This field is required')

      await typeInto(wrapper, 'x')
      await blur(wrapper)

      expect(wrapper.classes()).not.toContain('base-input--error')
      expect(helperText(wrapper)).toBe('Hint')
      expect(wrapper.get('.base-input__helper').classes()).not.toContain(
        'base-input__helper--error',
      )
    })

    it('replaces the state class while there is a validation error', async () => {
      const wrapper = mountVModel({ rules: ['required'], state: 'success' })
      expect(wrapper.classes()).toContain('base-input--success')

      await blur(wrapper)

      expect(wrapper.classes()).toContain('base-input--error')
      expect(wrapper.classes()).not.toContain('base-input--success')
    })

    it('prefers the validation error over errorMessage and helperText', async () => {
      const wrapper = mountVModel({
        rules: ['required'],
        errorMessage: 'Server said no',
        helperText: 'Hint',
      })

      await blur(wrapper)

      expect(helperText(wrapper)).toBe('This field is required')
    })
  })

  describe('mounted payload', () => {
    it('emits mounted once with validate and focus', () => {
      const wrapper = mountInput()

      expect(emittedArgs(wrapper, 'mounted')).toHaveLength(1)
      expect(Object.keys(mountedApi(wrapper)).sort()).toEqual(['focus', 'validate'])
      expect(typeof mountedApi(wrapper).validate).toBe('function')
      expect(typeof mountedApi(wrapper).focus).toBe('function')
    })

    it('validate() returns the result, emits it with the name and renders the error', async () => {
      const wrapper = mountInput({ rules: ['required'], name: 'email' })

      expect(mountedApi(wrapper).validate()).toBe(false)
      await nextTick()

      expect(lastValidation(wrapper)).toStrictEqual({
        valid: false,
        error: 'This field is required',
        name: 'email',
      })
      expect(wrapper.classes()).toContain('base-input--error')
      expect(helperText(wrapper)).toBe('This field is required')
    })

    it('validate() returns true for a valid value', async () => {
      const wrapper = mountInput({ rules: ['required'], modelValue: 'ok', name: 'email' })

      expect(mountedApi(wrapper).validate()).toBe(true)
      await nextTick()

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '', name: 'email' })
    })

    it('focus() focuses the input', async () => {
      const wrapper = mountInput({}, { attachTo: document.body })

      mountedApi(wrapper).focus()
      await nextTick()

      expect(document.activeElement).toBe(wrapper.get('input').element)
      expect(emittedArgs(wrapper, 'focus')).toHaveLength(1)
      expect(wrapper.classes()).toContain('base-input--focused')
    })
  })
})

describe('BaseInput exposed API', () => {
  const mountWithTemplateRef = () => {
    const exposed = ref<Record<string, unknown> | null>(null)
    const Parent = defineComponent({
      setup: () => () => h(BaseInput, { ref: exposed }),
    })
    mount(Parent)
    return exposed
  }

  // BUG: BaseInput has no defineExpose, so focus() is not reachable through a template ref
  it.fails('exposes focus() to a parent through a template ref', () => {
    const exposed = mountWithTemplateRef()

    expect(typeof exposed.value?.focus).toBe('function')
  })

  // BUG: BaseInput has no defineExpose, so validate() is not reachable through a template ref
  it.fails('exposes validate() to a parent through a template ref', () => {
    const exposed = mountWithTemplateRef()

    expect(typeof exposed.value?.validate).toBe('function')
  })
})

describe('BaseInput known bugs', () => {
  // BUG: blur validates the masked display string while typing validates the emitted raw value
  it.fails('validates a complete masked CPF against max length the same way on blur', async () => {
    const wrapper = mountVModel({ mask: 'cpf', rules: [{ max: 11 }] })

    await typeInto(wrapper, '12345678901')
    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
  })

  // BUG: blur runs Number('R$ 1.000,00') which is NaN, so minValue always fails on a currency mask
  it.fails('accepts a currency value above minValue on blur', async () => {
    const wrapper = mountVModel({ mask: 'currency', modelValue: 1000, rules: [{ minValue: 100 }] })

    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
  })

  // BUG: blur runs Number('R$ 1.000,00') which is NaN, so maxValue always fails on a currency mask
  it.fails('accepts a currency value below maxValue on blur', async () => {
    const wrapper = mountVModel({ mask: 'currency', modelValue: 1000, rules: [{ maxValue: 5000 }] })

    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
  })

  it('accepts a numeric modelValue that satisfies the min length rule', async () => {
    const wrapper = mountInput({ modelValue: 12345, rules: [{ min: 3 }] })

    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
  })

  it('accepts a numeric modelValue that satisfies the max length rule', async () => {
    const wrapper = mountInput({ modelValue: 12345, rules: [{ max: 10 }] })

    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
  })

  it('rejects numeric 0 for { minValue: 1 }', async () => {
    const wrapper = mountInput({ modelValue: 0, rules: [{ minValue: 1 }] })

    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({
      valid: false,
      error: 'Value must be at least 1',
    })
  })

  // BUG: only the first key of a rule object is read, so { message, min } never runs min
  it.fails('runs min when the message key comes first in the rule object', async () => {
    const wrapper = mountVModel({ rules: [{ message: 'Too short', min: 3 }] })

    await typeInto(wrapper, 'ab')
    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: false, error: 'Too short' })
  })

  // BUG: { required: false } still enforces the required validator
  it.fails('does not enforce { required: false }', async () => {
    const wrapper = mountVModel({ rules: [{ required: false }] })

    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
  })

  // BUG: { required: false } still marks the field as required in the label
  it.fails('does not mark { required: false } as required', () => {
    const wrapper = mountInput({ label: 'Name', rules: [{ required: false }] })

    expect(wrapper.find('.base-input__required').exists()).toBe(false)
  })

  // BUG: the name prop is not bound to the DOM element
  it.fails('binds the name prop to the input element', () => {
    const wrapper = mountInput({ name: 'email' })

    expect(wrapper.get('input').attributes('name')).toBe('email')
  })
})
