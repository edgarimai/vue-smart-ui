import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { BaseTextarea, useValidationConfig } from '../../src'

type TextareaProps = InstanceType<typeof BaseTextarea>['$props']
type Rules = NonNullable<TextareaProps['rules']>

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

const mountTextarea = (props: TextareaProps = {}, options: MountOptions = {}) =>
  mount(BaseTextarea, { props, ...options })

type TextareaWrapper = ReturnType<typeof mountTextarea>

// Mounts with a minimal v-model binding so the displayed value follows what the textarea emits.
function mountVModel(props: TextareaProps = {}): TextareaWrapper {
  const wrapper: TextareaWrapper = mount(BaseTextarea, {
    props: {
      ...props,
      'onUpdate:modelValue': (value: string) => {
        void wrapper.setProps({ modelValue: value })
      },
    },
  })
  return wrapper
}

const emittedArgs = (wrapper: TextareaWrapper, name: string): unknown[][] =>
  wrapper.emitted(name) ?? []

const modelUpdates = (wrapper: TextareaWrapper): unknown[] =>
  emittedArgs(wrapper, 'update:modelValue').map((args) => args[0])

const validations = (wrapper: TextareaWrapper): ValidationPayload[] =>
  emittedArgs(wrapper, 'validation').map((args) => args[0] as ValidationPayload)

const lastValidation = (wrapper: TextareaWrapper): ValidationPayload | undefined =>
  validations(wrapper).at(-1)

const mountedApi = (wrapper: TextareaWrapper): MountedPayload =>
  emittedArgs(wrapper, 'mounted')[0][0] as MountedPayload

const typeInto = (wrapper: TextareaWrapper, value: string) =>
  wrapper.get('textarea').setValue(value)

const blur = (wrapper: TextareaWrapper) => wrapper.get('textarea').trigger('blur')

const displayed = (wrapper: TextareaWrapper): string => wrapper.get('textarea').element.value

const helperText = (wrapper: TextareaWrapper): string | undefined => {
  const helper = wrapper.find('.base-textarea__helper')
  return helper.exists() ? helper.text() : undefined
}

// jsdom has no layout, so scrollHeight is always 0 unless a test provides one.
function mockScrollHeight(initial: number): (next: number) => void {
  let height = initial
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(() => height)
  return (next) => {
    height = next
  }
}

enableAutoUnmount(afterEach)

const { setValidationMessages, resetValidationMessages } = useValidationConfig()

afterEach(() => {
  resetValidationMessages()
  vi.restoreAllMocks()
})

describe('BaseTextarea rendering', () => {
  it('renders a textarea with the base classes and the default props', () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get('textarea')

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'vsui',
        'base-textarea',
        'base-textarea--default',
        'base-textarea--resize-vertical',
      ]),
    )
    expect(textarea.classes()).toContain('base-textarea__field')
    expect(textarea.attributes('rows')).toBe('3')
    expect(textarea.element.value).toBe('')
    expect(wrapper.find('label').exists()).toBe(false)
    expect(wrapper.find('.base-textarea__helper').exists()).toBe(false)
  })

  it('uses the id prop on the textarea and generates one otherwise', () => {
    expect(mountTextarea({ id: 'my-area' }).get('textarea').attributes('id')).toBe('my-area')
    expect(mountTextarea().get('textarea').attributes('id')).toMatch(/^textarea-\d+$/)
  })

  it.each(['filled', 'outlined'] as const)('applies the %s variant class', (variant) => {
    expect(mountTextarea({ variant }).classes()).toContain(`base-textarea--${variant}`)
  })

  it.each(['none', 'both', 'horizontal', 'vertical'] as const)(
    'applies the resize-%s class',
    (resize) => {
      expect(mountTextarea({ resize }).classes()).toContain(`base-textarea--resize-${resize}`)
    },
  )

  it('applies the block modifier', () => {
    expect(mountTextarea().classes()).not.toContain('base-textarea--block')
    expect(mountTextarea({ block: true }).classes()).toContain('base-textarea--block')
  })

  it('applies the transparent wrapper modifier', () => {
    const wrapper = mountTextarea({ transparentBg: true })

    expect(wrapper.get('.base-textarea__wrapper').classes()).toContain(
      'base-textarea__wrapper--transparent',
    )
  })

  it('renders the label, placeholder, rows and readonly attributes', () => {
    const wrapper = mountTextarea({
      label: 'Notes',
      placeholder: 'Write here',
      rows: 6,
      readonly: true,
    })
    const textarea = wrapper.get('textarea')

    expect(wrapper.get('label.base-textarea__label').text()).toBe('Notes')
    expect(textarea.attributes('placeholder')).toBe('Write here')
    expect(textarea.attributes('rows')).toBe('6')
    expect(textarea.element.readOnly).toBe(true)
  })

  it('disables the textarea and applies the disabled class', () => {
    const wrapper = mountTextarea({ disabled: true })

    expect(wrapper.get('textarea').element.disabled).toBe(true)
    expect(wrapper.classes()).toContain('base-textarea--disabled')
  })

  it('forwards non-prop attributes and classes to the root element', () => {
    const wrapper = mount(BaseTextarea, {
      attrs: { 'data-testid': 'field', class: 'custom' },
    })

    expect(wrapper.attributes('data-testid')).toBe('field')
    expect(wrapper.classes()).toContain('custom')
    expect(wrapper.get('textarea').attributes('data-testid')).toBeUndefined()
  })

  describe('required marker', () => {
    it('shows the asterisk and required attributes when the required prop is set', () => {
      const wrapper = mountTextarea({ label: 'Notes', required: true })
      const textarea = wrapper.get('textarea')

      expect(wrapper.get('.base-textarea__required').text()).toBe('*')
      expect(textarea.element.required).toBe(true)
      expect(textarea.attributes('aria-required')).toBe('true')
    })

    it('shows the asterisk when a required rule is configured', () => {
      expect(
        mountTextarea({ label: 'Notes', rules: ['required'] })
          .find('.base-textarea__required')
          .exists(),
      ).toBe(true)
      expect(
        mountTextarea({ label: 'Notes', rules: [{ required: true }] })
          .find('.base-textarea__required')
          .exists(),
      ).toBe(true)
    })

    it('does not show the asterisk otherwise', () => {
      const wrapper = mountTextarea({ label: 'Notes', rules: [{ min: 3 }, { required: false }] })

      expect(wrapper.find('.base-textarea__required').exists()).toBe(false)
      expect(wrapper.get('textarea').element.required).toBe(false)
      expect(wrapper.get('textarea').attributes('aria-required')).toBe('false')
    })
  })

  describe('state and helper messages', () => {
    it.each(['success', 'error', 'warning'] as const)('applies the %s state class', (state) => {
      expect(mountTextarea({ state }).classes()).toContain(`base-textarea--${state}`)
    })

    it('renders the helper text without the error modifier', () => {
      const wrapper = mountTextarea({ helperText: 'Be brief' })

      expect(helperText(wrapper)).toBe('Be brief')
      expect(wrapper.get('.base-textarea__helper').classes()).not.toContain(
        'base-textarea__helper--error',
      )
    })

    it('prefers errorMessage over helperText without switching to the error state', () => {
      const wrapper = mountTextarea({ helperText: 'Hint', errorMessage: 'Server said no' })

      expect(helperText(wrapper)).toBe('Server said no')
      expect(wrapper.classes()).not.toContain('base-textarea--error')
      expect(wrapper.get('.base-textarea__helper').classes()).not.toContain(
        'base-textarea__helper--error',
      )
    })
  })
})

describe('BaseTextarea events and v-model', () => {
  it('shows the modelValue and follows prop updates', async () => {
    const wrapper = mountTextarea({ modelValue: 'hello' })

    expect(displayed(wrapper)).toBe('hello')

    await wrapper.setProps({ modelValue: 'world' })
    expect(displayed(wrapper)).toBe('world')
  })

  it('emits update:modelValue with the typed value', async () => {
    const wrapper = mountTextarea()

    await typeInto(wrapper, 'line 1\nline 2')

    expect(modelUpdates(wrapper)).toEqual(['line 1\nline 2'])
  })

  it('works with v-model on a parent', async () => {
    const model = ref('start')
    const Parent = defineComponent({
      setup: () => () =>
        h(BaseTextarea, {
          modelValue: model.value,
          'onUpdate:modelValue': (value: string) => {
            model.value = value
          },
        }),
    })
    const wrapper = mount(Parent)

    expect(wrapper.get('textarea').element.value).toBe('start')

    await wrapper.get('textarea').setValue('next')
    expect(model.value).toBe('next')
  })

  it('emits input with the native event', async () => {
    const wrapper = mountTextarea()

    await typeInto(wrapper, 'a')

    const [payload] = emittedArgs(wrapper, 'input')[0]
    expect(payload).toBeInstanceOf(Event)
  })

  it('emits focus and blur and toggles the focused class', async () => {
    const wrapper = mountTextarea()
    const textarea = wrapper.get('textarea')

    await textarea.trigger('focus')
    expect(emittedArgs(wrapper, 'focus')).toHaveLength(1)
    expect(wrapper.classes()).toContain('base-textarea--focused')

    await textarea.trigger('blur')
    expect(emittedArgs(wrapper, 'blur')).toHaveLength(1)
    expect(wrapper.classes()).not.toContain('base-textarea--focused')
  })
})

describe('BaseTextarea validation', () => {
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

    it('lets min and max pass on an empty value', async () => {
      const wrapper = mountVModel({ rules: [{ min: 3 }, { max: 5 }] })

      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
    })

    it('reports the first failing rule', async () => {
      const wrapper = mountVModel({ rules: ['required', { min: 3 }] })

      await blur(wrapper)
      expect(lastValidation(wrapper)?.error).toBe('This field is required')

      await typeInto(wrapper, 'ab')
      await blur(wrapper)
      expect(lastValidation(wrapper)?.error).toBe('Must be at least 3 characters')
    })

    it('ignores rules the textarea does not implement', async () => {
      const wrapper = mountVModel({ rules: ['email', { pattern: '^x$' }, 'unknown'] })

      await typeInto(wrapper, 'not an email')
      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
    })
  })

  describe('custom rules and messages', () => {
    it('runs a custom validator and uses its message', async () => {
      const validator = vi.fn((value: string) => value === 'ok')
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
  })

  describe('when validation runs', () => {
    it('validates on blur by default and emits { valid, error } without a name', async () => {
      const wrapper = mountVModel({ rules: ['required'], name: 'notes' })

      await blur(wrapper)

      expect(validations(wrapper)).toStrictEqual([
        { valid: false, error: 'This field is required' },
      ])
    })

    it('validates the text in the element on blur', async () => {
      const wrapper = mountTextarea({ rules: [{ min: 3 }] })

      await typeInto(wrapper, 'ab')
      await blur(wrapper)

      expect(lastValidation(wrapper)).toStrictEqual({
        valid: false,
        error: 'Must be at least 3 characters',
      })
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
      expect(wrapper.find('.base-textarea__helper').exists()).toBe(false)
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
      expect(wrapper.classes()).toContain('base-textarea--error')

      await typeInto(wrapper, 'abc')
      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
      expect(helperText(wrapper)).toBeUndefined()
      expect(wrapper.classes()).not.toContain('base-textarea--error')
    })
  })

  describe('error state rendering', () => {
    it('shows the error with the error classes and hides it once valid on blur', async () => {
      const wrapper = mountVModel({ rules: ['required'], helperText: 'Hint' })

      await blur(wrapper)

      expect(wrapper.classes()).toContain('base-textarea--error')
      expect(wrapper.get('.base-textarea__helper').classes()).toContain(
        'base-textarea__helper--error',
      )
      expect(helperText(wrapper)).toBe('This field is required')

      await typeInto(wrapper, 'x')
      await blur(wrapper)

      expect(wrapper.classes()).not.toContain('base-textarea--error')
      expect(helperText(wrapper)).toBe('Hint')
      expect(wrapper.get('.base-textarea__helper').classes()).not.toContain(
        'base-textarea__helper--error',
      )
    })

    it('replaces the state class while there is a validation error', async () => {
      const wrapper = mountVModel({ rules: ['required'], state: 'success' })
      expect(wrapper.classes()).toContain('base-textarea--success')

      await blur(wrapper)

      expect(wrapper.classes()).toContain('base-textarea--error')
      expect(wrapper.classes()).not.toContain('base-textarea--success')
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
      const wrapper = mountTextarea()

      expect(emittedArgs(wrapper, 'mounted')).toHaveLength(1)
      expect(Object.keys(mountedApi(wrapper)).sort()).toEqual(['focus', 'validate'])
      expect(typeof mountedApi(wrapper).validate).toBe('function')
      expect(typeof mountedApi(wrapper).focus).toBe('function')
    })

    it('validate() returns the result, emits it with the name and renders the error', async () => {
      const wrapper = mountTextarea({ rules: ['required'], name: 'notes' })

      expect(mountedApi(wrapper).validate()).toBe(false)
      await nextTick()

      expect(lastValidation(wrapper)).toStrictEqual({
        valid: false,
        error: 'This field is required',
        name: 'notes',
      })
      expect(wrapper.classes()).toContain('base-textarea--error')
      expect(helperText(wrapper)).toBe('This field is required')
    })

    it('validate() returns true for a valid modelValue', async () => {
      const wrapper = mountTextarea({ rules: ['required'], modelValue: 'ok', name: 'notes' })

      expect(mountedApi(wrapper).validate()).toBe(true)
      await nextTick()

      expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '', name: 'notes' })
    })

    it('focus() focuses the textarea', async () => {
      const wrapper = mountTextarea({}, { attachTo: document.body })

      mountedApi(wrapper).focus()
      await nextTick()

      expect(document.activeElement).toBe(wrapper.get('textarea').element)
      expect(emittedArgs(wrapper, 'focus')).toHaveLength(1)
      expect(wrapper.classes()).toContain('base-textarea--focused')
    })
  })
})

describe('BaseTextarea autoResize', () => {
  it('does not touch the height when autoResize is off', async () => {
    mockScrollHeight(100)
    const wrapper = mountVModel()

    await typeInto(wrapper, 'a\nb\nc')

    expect(wrapper.get('textarea').element.style.height).toBe('')
  })

  it('sizes the textarea to its content (plus 2px) on mount', () => {
    mockScrollHeight(100)
    const wrapper = mountTextarea({ autoResize: true, modelValue: 'a\nb\nc' })

    expect(wrapper.get('textarea').element.style.height).toBe('102px')
  })

  it('recomputes the height when the user types', async () => {
    const setScrollHeight = mockScrollHeight(100)
    const wrapper = mountVModel({ autoResize: true })
    expect(wrapper.get('textarea').element.style.height).toBe('102px')

    setScrollHeight(240)
    await typeInto(wrapper, 'a\nb\nc\nd\ne\nf')

    expect(wrapper.get('textarea').element.style.height).toBe('242px')
  })

  it('caps the height at maxRows times the line height', async () => {
    // jsdom does not resolve line-height, so the computed style is provided explicitly.
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '20px',
    } as CSSStyleDeclaration)
    const setScrollHeight = mockScrollHeight(40)
    const wrapper = mountVModel({ autoResize: true, maxRows: 3 })

    setScrollHeight(300)
    await typeInto(wrapper, 'a\nb\nc\nd\ne\nf')

    expect(wrapper.get('textarea').element.style.height).toBe('60px')
  })

  it('recomputes the height when the modelValue changes programmatically', async () => {
    const setScrollHeight = mockScrollHeight(100)
    const wrapper = mountTextarea({ autoResize: true, modelValue: 'short' })

    setScrollHeight(300)
    await wrapper.setProps({ modelValue: 'a\nlot\nmore\ntext\nthan\nbefore' })

    expect(wrapper.get('textarea').element.style.height).toBe('302px')
  })
})

describe('BaseTextarea exposed API', () => {
  const mountWithTemplateRef = () => {
    const exposed = ref<Record<string, unknown> | null>(null)
    const Parent = defineComponent({
      setup: () => () => h(BaseTextarea, { ref: exposed }),
    })
    mount(Parent)
    return exposed
  }

  it('exposes focus() to a parent through a template ref', () => {
    const exposed = mountWithTemplateRef()

    expect(typeof exposed.value?.focus).toBe('function')
  })

  it('exposes validate() to a parent through a template ref', () => {
    const exposed = mountWithTemplateRef()

    expect(typeof exposed.value?.validate).toBe('function')
  })
})

describe('BaseTextarea known bugs', () => {
  it('runs min when the message key comes first in the rule object', async () => {
    const wrapper = mountVModel({ rules: [{ message: 'Too short', min: 3 }] })

    await typeInto(wrapper, 'ab')
    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: false, error: 'Too short' })
  })

  it('does not enforce { required: false }', async () => {
    const wrapper = mountVModel({ rules: [{ required: false }] })

    await blur(wrapper)

    expect(lastValidation(wrapper)).toStrictEqual({ valid: true, error: '' })
  })

  it('binds the name prop to the textarea element', () => {
    const wrapper = mountTextarea({ name: 'notes' })

    expect(wrapper.get('textarea').attributes('name')).toBe('notes')
  })

  it('uses the required message configured through useValidationConfig', async () => {
    setValidationMessages({ required: 'Obrigatório' })
    const wrapper = mountVModel({ rules: ['required'] })

    await blur(wrapper)

    expect(lastValidation(wrapper)?.error).toBe('Obrigatório')
  })

  it('uses the min message configured through useValidationConfig', async () => {
    setValidationMessages({ min: (min) => `Mínimo de ${min} caracteres` })
    const wrapper = mountVModel({ rules: [{ min: 3 }] })

    await typeInto(wrapper, 'ab')
    await blur(wrapper)

    expect(lastValidation(wrapper)?.error).toBe('Mínimo de 3 caracteres')
  })

  it('clears a blur error as soon as a valid value is typed', async () => {
    const wrapper = mountVModel({ rules: ['required'] })

    await blur(wrapper)
    expect(wrapper.classes()).toContain('base-textarea--error')

    await typeInto(wrapper, 'valid text')

    expect(wrapper.classes()).not.toContain('base-textarea--error')
    expect(helperText(wrapper)).toBeUndefined()
  })
})
