import { describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import BaseSegmentedButtons from '../../src/components/BaseSegmentedButtons.vue'

type Model = string | number | unknown[] | null
type SegProps = InstanceType<typeof BaseSegmentedButtons>['$props']

/** Object models are accepted at runtime in single mode but are not part of the declared prop type. */
function asModel(value: unknown): Model {
  return value as Model
}

interface Opt {
  value: number
  label: string
}

const PRIMITIVES = ['a', 'b', 'c']
const OBJECTS: Opt[] = [
  { value: 1, label: 'One' },
  { value: 2, label: 'Two' },
  { value: 3, label: 'Three' },
]

function buttons(wrapper: VueWrapper) {
  return wrapper.findAll('button.base-segmented-buttons__button')
}

function selectedLabels(wrapper: VueWrapper): string[] {
  return buttons(wrapper)
    .filter((b) => b.classes().includes('base-segmented-buttons__button--selected'))
    .map((b) => b.text())
}

function lastEmitted(wrapper: VueWrapper, name: string): unknown {
  const events = wrapper.emitted(name)
  return events?.[events.length - 1]?.[0]
}

/** Mounts the component wired like `v-model`: every update:modelValue is written back to the prop. */
function mountModel(props: SegProps): VueWrapper {
  const wrapper: VueWrapper = mount(BaseSegmentedButtons, {
    props: {
      ...props,
      'onUpdate:modelValue': (value: Model) => wrapper.setProps({ modelValue: value }),
    },
  })
  return wrapper
}

describe('BaseSegmentedButtons rendering', () => {
  it('renders one type="button" button per option with the base classes', () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES } })

    expect(wrapper.classes()).toContain('base-segmented-buttons-wrapper')
    const container = wrapper.find('.base-segmented-buttons')
    expect(container.classes()).toEqual(
      expect.arrayContaining(['vsui', 'base-segmented-buttons', 'base-segmented-buttons--medium']),
    )
    expect(buttons(wrapper)).toHaveLength(3)
    expect(buttons(wrapper).map((b) => b.text())).toEqual(PRIMITIVES)
    for (const button of buttons(wrapper)) {
      expect(button.attributes('type')).toBe('button')
      expect(button.classes()).toContain('base-segmented-buttons__button--primary')
    }
  })

  it('renders nothing selected by default', () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES } })

    expect(selectedLabels(wrapper)).toEqual([])
  })

  it('marks the first, middle and last buttons', () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES } })
    const [first, middle, last] = buttons(wrapper)

    expect(first.classes()).toContain('base-segmented-buttons__button--first')
    expect(first.classes()).not.toContain('base-segmented-buttons__button--last')
    expect(middle.classes()).toContain('base-segmented-buttons__button--middle')
    expect(last.classes()).toContain('base-segmented-buttons__button--last')
    expect(last.classes()).not.toContain('base-segmented-buttons__button--middle')
  })

  it('marks a single button as both first and last', () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: ['only'] } })

    expect(buttons(wrapper)[0].classes()).toEqual(
      expect.arrayContaining([
        'base-segmented-buttons__button--first',
        'base-segmented-buttons__button--last',
      ]),
    )
  })

  it.each(['primary', 'secondary', 'gray'] as const)(
    'applies the "%s" variant class',
    (variant) => {
      const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES, variant } })

      for (const button of buttons(wrapper)) {
        expect(button.classes()).toContain(`base-segmented-buttons__button--${variant}`)
      }
    },
  )

  it.each(['small', 'medium', 'large'] as const)('applies the "%s" size class', (size) => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES, size } })

    expect(wrapper.find('.base-segmented-buttons').classes()).toContain(
      `base-segmented-buttons--${size}`,
    )
  })

  it('applies the block modifier on the container', () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES, block: true } })

    expect(wrapper.find('.base-segmented-buttons').classes()).toContain(
      'base-segmented-buttons--block',
    )
  })

  it('uses the id prop on the container, or generates a "segmented-buttons-<n>" id', () => {
    const custom = mount(BaseSegmentedButtons, { props: { id: 'view-mode', options: PRIMITIVES } })
    const auto = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES } })

    expect(custom.find('.base-segmented-buttons').attributes('id')).toBe('view-mode')
    expect(auto.find('.base-segmented-buttons').attributes('id')).toMatch(/^segmented-buttons-\d+$/)
  })

  it('renders the label, with a required marker when a required rule exists', () => {
    const plain = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES, label: 'Mode' } })
    const required = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, label: 'Mode', rules: ['required'] },
    })

    expect(plain.find('.base-segmented-buttons__label').text()).toBe('Mode')
    expect(plain.find('.base-segmented-buttons__required').exists()).toBe(false)
    expect(required.find('.base-segmented-buttons__required').text()).toBe('*')
  })

  it('shows the required marker for object rules declaring required', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, label: 'Mode', rules: [{ required: true }] },
    })

    expect(wrapper.find('.base-segmented-buttons__required').exists()).toBe(true)
  })

  it('does not render a label element without the label prop', () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES } })

    expect(wrapper.find('.base-segmented-buttons__label').exists()).toBe(false)
  })

  it('renders helper text, and no helper element without any message', () => {
    const withHelper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, helperText: 'Pick one' },
    })
    const without = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES } })

    expect(withHelper.find('.base-segmented-buttons__helper').text()).toBe('Pick one')
    expect(without.find('.base-segmented-buttons__helper').exists()).toBe(false)
  })
})

describe('BaseSegmentedButtons single selection', () => {
  it('highlights the option matching the model value', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, modelValue: 'b' },
    })

    expect(selectedLabels(wrapper)).toEqual(['b'])
  })

  it('emits update:modelValue and change with the clicked value', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, modelValue: null },
    })

    await buttons(wrapper)[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
    expect(wrapper.emitted('change')).toEqual([['b']])
  })

  it('emits null when the selected option is clicked again', async () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES, modelValue: 'b' } })

    await buttons(wrapper)[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })

  it('replaces the selection when another option is clicked (v-model round trip)', async () => {
    const wrapper = mountModel({ options: PRIMITIVES, modelValue: 'a' })

    await buttons(wrapper)[2].trigger('click')
    expect(selectedLabels(wrapper)).toEqual(['c'])

    await buttons(wrapper)[2].trigger('click')
    expect(selectedLabels(wrapper)).toEqual([])
    expect(lastEmitted(wrapper, 'update:modelValue')).toBeNull()
  })

  it('supports numeric options and keeps the number type in the payload', async () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: [10, 20], modelValue: 10 } })

    expect(selectedLabels(wrapper)).toEqual(['10'])
    await buttons(wrapper)[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[20]])
  })

  it('does not match a number model against string options (strict comparison)', () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: ['1', '2'], modelValue: 1 } })

    expect(selectedLabels(wrapper)).toEqual([])
  })
})

describe('BaseSegmentedButtons object options', () => {
  it('renders labels from the label key and emits the whole option object', async () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: OBJECTS, modelValue: null } })

    expect(buttons(wrapper).map((b) => b.text())).toEqual(['One', 'Two', 'Three'])
    await buttons(wrapper)[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[OBJECTS[1]]])
  })

  it('highlights the option whose value key equals the value of the model object', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: OBJECTS, modelValue: asModel({ value: 3, label: 'anything' }) },
    })

    expect(selectedLabels(wrapper)).toEqual(['Three'])
  })

  it('honours custom valueKey and labelKey', async () => {
    const options = [
      { id: 'x', name: 'Ex' },
      { id: 'y', name: 'Why' },
    ]
    const wrapper = mount(BaseSegmentedButtons, {
      props: {
        options,
        valueKey: 'id',
        labelKey: 'name',
        modelValue: asModel({ id: 'y', name: 'Why' }),
      },
    })

    expect(buttons(wrapper).map((b) => b.text())).toEqual(['Ex', 'Why'])
    expect(selectedLabels(wrapper)).toEqual(['Why'])

    await buttons(wrapper)[0].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[options[0]]])
  })

  it('falls back to the value, then to the stringified option, when the label is missing', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: [{ value: 'fallback' }, { other: 1 }] },
    })

    expect(buttons(wrapper)[0].text()).toBe('fallback')
    expect(buttons(wrapper)[1].text()).toBe('[object Object]')
  })

  it('emits null when the selected object option is clicked again', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: OBJECTS, modelValue: asModel(OBJECTS[0]) },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })
})

describe('BaseSegmentedButtons multiple selection', () => {
  it('highlights every option contained in the model', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, modelValue: ['a', 'c'] },
    })

    expect(selectedLabels(wrapper)).toEqual(['a', 'c'])
  })

  it('adds a value to the array and emits a new array', async () => {
    const model: string[] = ['a']
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, modelValue: model },
    })

    await buttons(wrapper)[2].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[['a', 'c']]])
    expect(wrapper.emitted('change')).toEqual([[['a', 'c']]])
    expect(model).toEqual(['a'])
  })

  it('removes an already selected value', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, modelValue: ['a', 'b'] },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[['b']]])
  })

  it('starts from an empty array by default', async () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES, multiple: true } })

    await buttons(wrapper)[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[['b']]])
  })

  it('toggles several options through a v-model round trip', async () => {
    const wrapper = mountModel({ options: PRIMITIVES, multiple: true, modelValue: [] })

    await buttons(wrapper)[0].trigger('click')
    await buttons(wrapper)[1].trigger('click')
    expect(selectedLabels(wrapper)).toEqual(['a', 'b'])

    await buttons(wrapper)[0].trigger('click')
    expect(selectedLabels(wrapper)).toEqual(['b'])
    expect(lastEmitted(wrapper, 'update:modelValue')).toEqual(['b'])
  })

  it('works with object options and an object model', async () => {
    const wrapper = mountModel({ options: OBJECTS, multiple: true, modelValue: [OBJECTS[0]] })

    await buttons(wrapper)[1].trigger('click')
    expect(lastEmitted(wrapper, 'update:modelValue')).toEqual([OBJECTS[0], OBJECTS[1]])
    expect(selectedLabels(wrapper)).toEqual(['One', 'Two'])

    await buttons(wrapper)[0].trigger('click')
    expect(lastEmitted(wrapper, 'update:modelValue')).toEqual([OBJECTS[1]])
    expect(selectedLabels(wrapper)).toEqual(['Two'])
  })

  it('highlights nothing when multiple is on and the model is not an array', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, modelValue: 'a' },
    })

    expect(selectedLabels(wrapper)).toEqual([])
  })

  // BUG: with a primitive model and object options, clicking pushes the option OBJECT into the array
  it.fails('keeps a primitive model consistent when object options are clicked', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: OBJECTS, multiple: true, modelValue: [1] },
    })

    await buttons(wrapper)[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[[1, 2]]])
  })

  // BUG: with a primitive model and object options, a second click does not deselect the option
  it.fails('deselects on the second click with a primitive model and object options', async () => {
    const wrapper = mountModel({ options: OBJECTS, multiple: true, modelValue: [1] })

    await buttons(wrapper)[1].trigger('click')
    await buttons(wrapper)[1].trigger('click')

    expect(lastEmitted(wrapper, 'update:modelValue')).toEqual([1])
  })
})

describe('BaseSegmentedButtons disabled', () => {
  it('disables every button and applies the disabled modifier', () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES, disabled: true } })

    expect(wrapper.find('.base-segmented-buttons').classes()).toContain(
      'base-segmented-buttons--disabled',
    )
    for (const button of buttons(wrapper)) {
      expect(button.attributes('disabled')).toBeDefined()
    }
  })

  it('emits nothing when a disabled button is clicked', async () => {
    const wrapper = mount(BaseSegmentedButtons, { props: { options: PRIMITIVES, disabled: true } })

    await buttons(wrapper)[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.emitted('validation')).toBeUndefined()
  })
})

describe('BaseSegmentedButtons validation', () => {
  it('emits a valid validation result when the rule passes', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, rules: ['required'], modelValue: null },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(wrapper.emitted('validation')).toEqual([[{ valid: true, error: '' }]])
    expect(wrapper.find('.base-segmented-buttons').classes()).not.toContain(
      'base-segmented-buttons--error',
    )
  })

  it('reports "required" when the selection is cleared, and renders the error', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, rules: ['required'], modelValue: 'a' },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(wrapper.emitted('validation')).toEqual([
      [{ valid: false, error: 'This field is required' }],
    ])
    expect(wrapper.find('.base-segmented-buttons').classes()).toContain(
      'base-segmented-buttons--error',
    )
    const helper = wrapper.find('.base-segmented-buttons__helper')
    expect(helper.text()).toBe('This field is required')
    expect(helper.classes()).toContain('base-segmented-buttons__helper--error')
  })

  it('does not show a validation error before the user interacts', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, rules: ['required'], modelValue: null },
    })

    expect(wrapper.find('.base-segmented-buttons__helper').exists()).toBe(false)
    expect(wrapper.find('.base-segmented-buttons').classes()).not.toContain(
      'base-segmented-buttons--error',
    )
  })

  it('clears the error once the selection becomes valid again', async () => {
    const wrapper = mountModel({ options: PRIMITIVES, rules: ['required'], modelValue: 'a' })

    await buttons(wrapper)[0].trigger('click')
    expect(wrapper.find('.base-segmented-buttons__helper--error').exists()).toBe(true)

    await buttons(wrapper)[1].trigger('click')
    expect(wrapper.find('.base-segmented-buttons__helper').exists()).toBe(false)
    expect(lastEmitted(wrapper, 'validation')).toEqual({ valid: true, error: '' })
  })

  it('validates "min:n" and "max:n" on multiple selections, with singular and plural messages', async () => {
    const min = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, rules: ['min:2'], modelValue: [] },
    })
    await buttons(min)[0].trigger('click')
    expect(lastEmitted(min, 'validation')).toEqual({
      valid: false,
      error: 'Select at least 2 options',
    })

    const minOne = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, rules: ['min:1'], modelValue: ['a'] },
    })
    await buttons(minOne)[0].trigger('click')
    expect(lastEmitted(minOne, 'validation')).toEqual({
      valid: false,
      error: 'Select at least 1 option',
    })

    const max = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, rules: ['max:1'], modelValue: ['a'] },
    })
    await buttons(max)[1].trigger('click')
    expect(lastEmitted(max, 'validation')).toEqual({
      valid: false,
      error: 'Select no more than 1 option',
    })

    const maxTwo = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, rules: ['max:2'], modelValue: ['a', 'b'] },
    })
    await buttons(maxTwo)[2].trigger('click')
    expect(lastEmitted(maxTwo, 'validation')).toEqual({
      valid: false,
      error: 'Select no more than 2 options',
    })
  })

  it('accepts min/max passing values', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, multiple: true, rules: ['min:1', 'max:2'], modelValue: [] },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(lastEmitted(wrapper, 'validation')).toEqual({ valid: true, error: '' })
  })

  it('uses the custom message of an object rule wrapping a built-in validator', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: {
        options: PRIMITIVES,
        rules: [{ required: true, message: 'Choose something' }],
        modelValue: 'a',
      },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(lastEmitted(wrapper, 'validation')).toEqual({ valid: false, error: 'Choose something' })
    expect(wrapper.find('.base-segmented-buttons__helper').text()).toBe('Choose something')
  })

  it('uses the custom message of a "min" object rule', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: {
        options: PRIMITIVES,
        multiple: true,
        rules: [{ min: 2, message: 'Pick two' }],
        modelValue: [],
      },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(lastEmitted(wrapper, 'validation')).toEqual({ valid: false, error: 'Pick two' })
  })

  it('runs a custom validator rule without message, falling back to "Invalid selection"', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: {
        options: PRIMITIVES,
        rules: [{ validator: (value: unknown) => value !== 'b' }],
        modelValue: null,
      },
    })

    await buttons(wrapper)[1].trigger('click')
    expect(lastEmitted(wrapper, 'validation')).toEqual({ valid: false, error: 'Invalid selection' })

    await buttons(wrapper)[0].trigger('click')
    expect(lastEmitted(wrapper, 'validation')).toEqual({ valid: true, error: '' })
  })

  // BUG: a { validator, message } rule never runs the validator (it is treated as a built-in name)
  it.fails('runs a custom validator rule that also has a message', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: {
        options: PRIMITIVES,
        rules: [{ validator: (value: unknown) => value !== 'b', message: 'No b allowed' }],
        modelValue: null,
      },
    })

    await buttons(wrapper)[1].trigger('click')

    expect(lastEmitted(wrapper, 'validation')).toEqual({ valid: false, error: 'No b allowed' })
  })

  it('ignores unknown string rules', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, rules: ['unknown-rule'], modelValue: null },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(lastEmitted(wrapper, 'validation')).toEqual({ valid: true, error: '' })
  })

  it('stops at the first failing rule', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: {
        options: PRIMITIVES,
        multiple: true,
        rules: ['required', 'min:2'],
        modelValue: ['a'],
      },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(lastEmitted(wrapper, 'validation')).toEqual({
      valid: false,
      error: 'This field is required',
    })
  })

  it('does not validate on change when validateOnChange is false', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, rules: ['required'], modelValue: 'a', validateOnChange: false },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
    expect(wrapper.emitted('validation')).toBeUndefined()
    expect(wrapper.find('.base-segmented-buttons__helper').exists()).toBe(false)
  })

  it('does not emit validation when there are no rules, but still emits validation on change', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, modelValue: null },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(wrapper.emitted('validation')).toEqual([[{ valid: true, error: '' }]])
  })

  it('emits "mounted" with a validate function that validates the current model on demand', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, rules: ['required'], modelValue: null },
    })

    const mounted = wrapper.emitted('mounted')
    expect(mounted).toHaveLength(1)
    const payload = mounted?.[0]?.[0] as { validate: () => boolean }
    expect(typeof payload.validate).toBe('function')

    expect(payload.validate()).toBe(false)
    await wrapper.vm.$nextTick()

    expect(lastEmitted(wrapper, 'validation')).toEqual({
      valid: false,
      error: 'This field is required',
    })
    expect(wrapper.find('.base-segmented-buttons__helper').text()).toBe('This field is required')
    expect(wrapper.find('.base-segmented-buttons').classes()).toContain(
      'base-segmented-buttons--error',
    )

    await wrapper.setProps({ modelValue: 'a' })
    expect(payload.validate()).toBe(true)
  })
})

describe('BaseSegmentedButtons errorMessage', () => {
  it('renders the errorMessage prop as the message', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, errorMessage: 'Server says no', helperText: 'Hint' },
    })

    expect(wrapper.find('.base-segmented-buttons__helper').text()).toBe('Server says no')
  })

  it('falls back to the helper text when there is no error message', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, helperText: 'Hint' },
    })

    expect(wrapper.find('.base-segmented-buttons__helper').text()).toBe('Hint')
  })

  it('shows a validation error in place of the errorMessage once validation fails', async () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: {
        options: PRIMITIVES,
        rules: ['required'],
        modelValue: 'a',
        errorMessage: 'Server says no',
      },
    })

    await buttons(wrapper)[0].trigger('click')

    expect(wrapper.find('.base-segmented-buttons__helper').text()).toBe('This field is required')
  })

  it('applies the helper error class when only errorMessage is provided', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, errorMessage: 'Server says no' },
    })

    expect(wrapper.find('.base-segmented-buttons__helper').classes()).toContain(
      'base-segmented-buttons__helper--error',
    )
  })

  it('applies the container error class when only errorMessage is provided', () => {
    const wrapper = mount(BaseSegmentedButtons, {
      props: { options: PRIMITIVES, errorMessage: 'Server says no' },
    })

    expect(wrapper.find('.base-segmented-buttons').classes()).toContain(
      'base-segmented-buttons--error',
    )
  })
})
