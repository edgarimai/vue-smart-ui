import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import BaseCombobox from '../../src/components/BaseCombobox.vue'
import BasePopup from '../../src/components/BasePopup.vue'
import type { ComboboxOption } from '../../src/components/BaseCombobox.vue'

type ComboboxProps = InstanceType<typeof BaseCombobox>['$props']

interface ComboboxApi {
  validate: () => boolean
  focus: () => void
  open: () => void
  close: () => void
}

const FRUITS: ComboboxOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Pineapple', value: 'pineapple' },
]

const REQUIRED_MESSAGE = 'This field is required'

const wrappers: VueWrapper[] = []

function mountCombobox(
  props: ComboboxProps = {},
  slots: Record<string, string> = {},
  attachTo: HTMLElement = document.body,
): VueWrapper {
  const wrapper = mount(BaseCombobox, {
    attachTo,
    props: { options: FRUITS, ...props },
    slots,
  })
  wrappers.push(wrapper)
  return wrapper
}

const getApi = (wrapper: VueWrapper): ComboboxApi => {
  const payload = wrapper.emitted('mounted')?.[0]?.[0]
  if (!payload) throw new Error('mounted was not emitted')
  return payload as ComboboxApi
}

const getMenu = (): HTMLElement | null => document.body.querySelector('.base-combobox__menu')

const isMenuVisible = (): boolean => {
  const menu = getMenu()
  return menu !== null && menu.style.display !== 'none'
}

const getOptionEls = (): HTMLElement[] =>
  Array.from(document.body.querySelectorAll<HTMLElement>('.base-combobox__option'))

const optionLabels = (): string[] =>
  getOptionEls().map(
    (el) => el.querySelector('.base-combobox__option-label')?.textContent?.trim() ?? '',
  )

const toggleEl = (wrapper: VueWrapper) => wrapper.find('.base-combobox__wrapper')

const isOpenClass = (wrapper: VueWrapper): boolean =>
  wrapper.classes().includes('base-combobox--open')

const openCombobox = async (wrapper: VueWrapper): Promise<void> => {
  await toggleEl(wrapper).trigger('click')
  await flushPromises()
}

const press = async (wrapper: VueWrapper, key: string): Promise<void> => {
  await toggleEl(wrapper).trigger('keydown', { key })
  await flushPromises()
}

const clickOption = async (index: number): Promise<void> => {
  getOptionEls()[index].click()
  await flushPromises()
}

const lastModel = (wrapper: VueWrapper): unknown => {
  const events = wrapper.emitted('update:modelValue')
  return events?.[events.length - 1]?.[0]
}

const displayText = (wrapper: VueWrapper): string =>
  wrapper.find('.base-combobox__field--display').text()

const highlightedIndex = (): number =>
  getOptionEls().findIndex((el) => el.classList.contains('base-combobox__option--highlighted'))

afterEach(() => {
  while (wrappers.length) wrappers.pop()?.unmount()
  document.body.innerHTML = ''
})

describe('BaseCombobox rendering', () => {
  it('renders the base classes and the placeholder when nothing is selected', () => {
    const wrapper = mountCombobox()

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['vsui', 'base-combobox', 'base-combobox--default']),
    )
    const field = wrapper.find('.base-combobox__field--display')
    expect(field.text()).toBe('Select an option...')
    expect(field.classes()).toContain('base-combobox__field--placeholder')
  })

  it('renders a custom placeholder', () => {
    const wrapper = mountCombobox({ placeholder: 'Pick a fruit' })

    expect(displayText(wrapper)).toBe('Pick a fruit')
  })

  it.each(['default', 'filled', 'outlined'] as const)('applies the %s variant class', (variant) => {
    expect(mountCombobox({ variant }).classes()).toContain(`base-combobox--${variant}`)
  })

  it.each(['success', 'error', 'warning'] as const)('applies the %s state class', (state) => {
    expect(mountCombobox({ state }).classes()).toContain(`base-combobox--${state}`)
  })

  it('adds the multiple class in multiple mode', () => {
    expect(mountCombobox({ multiple: true }).classes()).toContain('base-combobox--multiple')
    expect(mountCombobox().classes()).not.toContain('base-combobox--multiple')
  })

  it('renders the label and a required marker for required, "required" rule and object rule', () => {
    const plain = mountCombobox({ label: 'Fruit' })
    expect(plain.find('.base-combobox__label').text()).toContain('Fruit')
    expect(plain.find('.base-combobox__required').exists()).toBe(false)

    const byProp = mountCombobox({ label: 'Fruit', required: true })
    expect(byProp.find('.base-combobox__required').text()).toBe('*')

    const byRule = mountCombobox({ label: 'Fruit', rules: ['required'] })
    expect(byRule.find('.base-combobox__required').exists()).toBe(true)

    const byObjectRule = mountCombobox({ label: 'Fruit', rules: [{ required: true }] })
    expect(byObjectRule.find('.base-combobox__required').exists()).toBe(true)

    const byOtherRule = mountCombobox({ label: 'Fruit', rules: ['min'] })
    expect(byOtherRule.find('.base-combobox__required').exists()).toBe(false)
  })

  it('does not render a label element without a label', () => {
    expect(mountCombobox().find('.base-combobox__label').exists()).toBe(false)
  })

  it('renders the helper text, and prefers errorMessage over it', () => {
    const helper = mountCombobox({ helperText: 'Choose one' })
    expect(helper.find('.base-combobox__helper').text()).toBe('Choose one')
    expect(helper.find('.base-combobox__helper--error').exists()).toBe(false)

    const both = mountCombobox({ helperText: 'Choose one', errorMessage: 'Bad choice' })
    expect(both.find('.base-combobox__helper').text()).toBe('Bad choice')

    expect(mountCombobox().find('.base-combobox__helper').exists()).toBe(false)
  })

  it('uses the id prop on the field, or generates a combobox-N id', () => {
    expect(mountCombobox({ id: 'fruit' }).find('#fruit').exists()).toBe(true)
    expect(mountCombobox().find('.base-combobox__field').attributes('id')).toMatch(/^combobox-\d+$/)
  })

  it('renders prefix and suffix icons and the matching modifier classes', () => {
    const wrapper = mountCombobox({ prefixIcon: 'icon-a', suffixIcon: 'icon-b' })

    expect(wrapper.find('.base-combobox__prefix i').classes()).toContain('icon-a')
    expect(wrapper.find('.base-combobox__suffix-content i').classes()).toContain('icon-b')
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['base-combobox--with-prefix', 'base-combobox--with-suffix']),
    )
  })

  it('renders the prefix and suffix slots', () => {
    const wrapper = mountCombobox(
      {},
      { prefix: '<b class="pre">P</b>', suffix: '<b class="suf">S</b>' },
    )

    expect(wrapper.find('.base-combobox__prefix .pre').exists()).toBe(true)
    expect(wrapper.find('.base-combobox__suffix-content .suf').exists()).toBe(true)
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['base-combobox--with-prefix', 'base-combobox--with-suffix']),
    )
  })

  it('renders the dropdown arrow and toggles its open modifier', async () => {
    const wrapper = mountCombobox()
    expect(wrapper.find('.base-combobox__arrow').classes()).not.toContain(
      'base-combobox__arrow--open',
    )

    await openCombobox(wrapper)

    expect(wrapper.find('.base-combobox__arrow').classes()).toContain('base-combobox__arrow--open')
  })

  it('renders the spinner in the field while loading', () => {
    expect(mountCombobox({ loading: true }).find('.base-combobox__spinner').exists()).toBe(true)
    expect(mountCombobox().find('.base-combobox__spinner').exists()).toBe(false)
  })

  it('renders a searchable field as an input', () => {
    const wrapper = mountCombobox({ searchable: true, placeholder: 'Type here' })

    const input = wrapper.find('input.base-combobox__field')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Type here')
    expect(wrapper.find('.base-combobox__field--display').exists()).toBe(false)
  })

  it('makes the wrapper focusable, except while a searchable combobox is open', async () => {
    const plain = mountCombobox()
    expect(toggleEl(plain).attributes('tabindex')).toBe('0')

    const searchable = mountCombobox({ searchable: true })
    expect(toggleEl(searchable).attributes('tabindex')).toBe('0')
    await openCombobox(searchable)
    expect(toggleEl(searchable).attributes('tabindex')).toBe('-1')
  })
})

describe('BaseCombobox menu', () => {
  it('is closed initially and lists every option when opened', async () => {
    const wrapper = mountCombobox()
    expect(isMenuVisible()).toBe(false)
    expect(isOpenClass(wrapper)).toBe(false)

    await openCombobox(wrapper)

    expect(isMenuVisible()).toBe(true)
    expect(isOpenClass(wrapper)).toBe(true)
    expect(optionLabels()).toEqual(['Apple', 'Banana', 'Cherry', 'Pineapple'])
  })

  it('toggles when the wrapper is clicked again', async () => {
    const wrapper = mountCombobox()

    await openCombobox(wrapper)
    await toggleEl(wrapper).trigger('click')

    expect(isOpenClass(wrapper)).toBe(false)
    expect(isMenuVisible()).toBe(false)
  })

  it('renders primitive string and number options using their string value as label', async () => {
    const wrapper = mountCombobox({ options: ['red', 'green', 42] })

    await openCombobox(wrapper)

    expect(optionLabels()).toEqual(['red', 'green', '42'])
  })

  it('renders the no-data text when there are no options', async () => {
    const wrapper = mountCombobox({ options: [] })

    await openCombobox(wrapper)

    expect(getMenu()?.querySelector('.base-combobox__no-data')?.textContent?.trim()).toBe(
      'No options found',
    )
    expect(getOptionEls()).toHaveLength(0)
  })

  it('renders a custom noDataText', async () => {
    const wrapper = mountCombobox({ options: [], noDataText: 'Nothing here' })

    await openCombobox(wrapper)

    expect(getMenu()?.querySelector('.base-combobox__no-data')?.textContent?.trim()).toBe(
      'Nothing here',
    )
  })

  it('renders the loading state instead of options or no-data while loading', async () => {
    const wrapper = mountCombobox({ loading: true })

    await openCombobox(wrapper)

    expect(getMenu()?.querySelector('.base-combobox__loading')?.textContent).toContain('Loading...')
    expect(getOptionEls()).toHaveLength(0)
    expect(getMenu()?.querySelector('.base-combobox__no-data')).toBeNull()
  })

  it('wraps option text by default and can disable it', async () => {
    const wrapped = mountCombobox()
    await openCombobox(wrapped)
    expect(document.querySelector('.base-combobox__option-label--wrap')).not.toBeNull()

    wrapped.unmount()
    wrappers.pop()
    document.body.innerHTML = ''

    const unwrapped = mountCombobox({ wrapOptionText: false })
    await openCombobox(unwrapped)
    expect(document.querySelector('.base-combobox__option-label--wrap')).toBeNull()
  })

  it('renders the option slot with the option and its selected state', async () => {
    const wrapper = mount(BaseCombobox, {
      attachTo: document.body,
      props: { options: FRUITS, modelValue: 'banana' },
      slots: {
        option: `<template #option="{ option, selected }">
          <i class="custom">{{ option.label }}:{{ selected }}</i>
        </template>`,
      },
    })
    wrappers.push(wrapper)

    await openCombobox(wrapper)

    const custom = Array.from(document.querySelectorAll('.custom')).map((el) => el.textContent)
    expect(custom).toEqual(['Apple:false', 'Banana:true', 'Cherry:false', 'Pineapple:false'])
    expect(document.querySelector('.base-combobox__option-label')).toBeNull()
  })

  it('highlights the option under the mouse', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)

    getOptionEls()[2].dispatchEvent(new Event('mouseenter'))
    await flushPromises()

    expect(highlightedIndex()).toBe(2)
  })
})

describe('BaseCombobox single selection', () => {
  it('displays the label of the option matching a primitive modelValue', () => {
    const wrapper = mountCombobox({ modelValue: 'banana' })

    expect(displayText(wrapper)).toBe('Banana')
    expect(wrapper.find('.base-combobox__field--display').classes()).not.toContain(
      'base-combobox__field--placeholder',
    )
  })

  it('displays the label of an object modelValue directly', () => {
    const wrapper = mountCombobox({ modelValue: { label: 'Dragonfruit', value: 'dragon' } })

    expect(displayText(wrapper)).toBe('Dragonfruit')
  })

  it('shows the placeholder when modelValue matches no option', () => {
    const wrapper = mountCombobox({ modelValue: 'unknown' })

    expect(displayText(wrapper)).toBe('Select an option...')
  })

  it('shows the label of a primitive option', () => {
    const wrapper = mountCombobox({ options: ['red', 'green'], modelValue: 'green' })

    expect(displayText(wrapper)).toBe('green')
  })

  it('supports custom labelKey and valueKey', async () => {
    const options = [
      { label: 'unused', value: 'unused', id: 1, name: 'One' },
      { label: 'unused', value: 'unused', id: 2, name: 'Two' },
    ]
    const wrapper = mountCombobox({ options, valueKey: 'id', labelKey: 'name', modelValue: 2 })
    expect(displayText(wrapper)).toBe('Two')

    await openCombobox(wrapper)
    expect(optionLabels()).toEqual(['One', 'Two'])
    expect(getOptionEls()[1].classList.contains('base-combobox__option--selected')).toBe(true)

    await clickOption(0)

    expect(lastModel(wrapper)).toBe(1)
    expect(wrapper.emitted('select')?.[0]).toEqual([options[0]])
  })

  it('falls back to the value when the label key is missing from an option', async () => {
    const wrapper = mountCombobox({
      options: [{ value: 'only-value' } as unknown as ComboboxOption],
    })

    await openCombobox(wrapper)

    expect(optionLabels()).toEqual(['only-value'])
  })

  it('emits update:modelValue with the option value and select with the option', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)

    await clickOption(1)

    expect(wrapper.emitted('update:modelValue')).toEqual([['banana']])
    expect(wrapper.emitted('select')).toEqual([[FRUITS[1]]])
  })

  it('emits the primitive itself for primitive options', async () => {
    const wrapper = mountCombobox({ options: ['red', 'green', 7] })
    await openCombobox(wrapper)

    await clickOption(0)
    await openCombobox(wrapper)
    await clickOption(2)

    expect(wrapper.emitted('update:modelValue')).toEqual([['red'], [7]])
    expect(wrapper.emitted('select')).toEqual([['red'], [7]])
  })

  it('closes after selecting and emits blur', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)

    await clickOption(0)

    expect(isOpenClass(wrapper)).toBe(false)
    expect(isMenuVisible()).toBe(false)
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })

  it('stays open after selecting when closeOnSelect is false', async () => {
    const wrapper = mountCombobox({ closeOnSelect: false })
    await openCombobox(wrapper)

    await clickOption(0)

    expect(isOpenClass(wrapper)).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['apple']])
    expect(wrapper.emitted('blur')).toBeUndefined()
  })

  it('emits the same value again when the selected option is clicked (no toggle-off)', async () => {
    const wrapper = mountCombobox({ modelValue: 'apple' })
    await openCombobox(wrapper)

    await clickOption(0)

    expect(wrapper.emitted('update:modelValue')).toEqual([['apple']])
  })

  it('marks the selected option and renders a check icon only on it', async () => {
    const wrapper = mountCombobox({ modelValue: 'cherry' })
    await openCombobox(wrapper)

    const selected = getOptionEls().map((el) =>
      el.classList.contains('base-combobox__option--selected'),
    )
    expect(selected).toEqual([false, false, true, false])
    expect(document.querySelectorAll('.base-combobox__option-check')).toHaveLength(1)
  })

  it('marks the option matching an object modelValue as selected', async () => {
    const wrapper = mountCombobox({ modelValue: { label: 'Banana', value: 'banana' } })
    await openCombobox(wrapper)

    expect(getOptionEls()[1].classList.contains('base-combobox__option--selected')).toBe(true)
  })

  it('does not open the menu when an option is clicked (click is stopped)', async () => {
    const wrapper = mountCombobox({ closeOnSelect: false })
    await openCombobox(wrapper)

    await clickOption(0)

    expect(isOpenClass(wrapper)).toBe(true)
  })
})

describe('BaseCombobox multiple selection', () => {
  it('adds and removes values through the options, emitting new arrays', async () => {
    const model = ['apple']
    const wrapper = mountCombobox({ multiple: true, modelValue: model, closeOnSelect: false })
    await openCombobox(wrapper)

    await clickOption(1)
    expect(lastModel(wrapper)).toEqual(['apple', 'banana'])

    await clickOption(0)
    expect(lastModel(wrapper)).toEqual([])
    expect(model).toEqual(['apple'])
  })

  it('starts a new array when modelValue is null', async () => {
    const wrapper = mountCombobox({ multiple: true })
    await openCombobox(wrapper)

    await clickOption(2)

    expect(lastModel(wrapper)).toEqual(['cherry'])
  })

  it('emits select with the clicked option in multiple mode', async () => {
    const wrapper = mountCombobox({ multiple: true })
    await openCombobox(wrapper)

    await clickOption(3)

    expect(wrapper.emitted('select')).toEqual([[FRUITS[3]]])
  })

  it('closes after each selection by default and stays open with closeOnSelect false', async () => {
    const closing = mountCombobox({ multiple: true })
    await openCombobox(closing)
    await clickOption(0)
    expect(isOpenClass(closing)).toBe(false)

    closing.unmount()
    wrappers.pop()
    document.body.innerHTML = ''

    const staying = mountCombobox({ multiple: true, closeOnSelect: false })
    await openCombobox(staying)
    await clickOption(0)
    expect(isOpenClass(staying)).toBe(true)
  })

  it('marks every selected option', async () => {
    const wrapper = mountCombobox({ multiple: true, modelValue: ['apple', 'cherry'] })
    await openCombobox(wrapper)

    expect(
      getOptionEls().map((el) => el.classList.contains('base-combobox__option--selected')),
    ).toEqual([true, false, true, false])
  })

  it('summarises selections as text when showTags is false', () => {
    expect(
      mountCombobox({ multiple: true, modelValue: [] }).find('.base-combobox__tags').exists(),
    ).toBe(false)
    expect(displayText(mountCombobox({ multiple: true, modelValue: ['apple'] }))).toBe(
      '1 item selected',
    )
    expect(displayText(mountCombobox({ multiple: true, modelValue: ['apple', 'banana'] }))).toBe(
      '2 items selected',
    )
  })

  it('supports selectedSingleText and a selectedMultipleText string with {count}', () => {
    const single = mountCombobox({
      multiple: true,
      modelValue: ['apple'],
      selectedSingleText: 'One fruit',
    })
    expect(displayText(single)).toBe('One fruit')

    const multiple = mountCombobox({
      multiple: true,
      modelValue: ['apple', 'banana', 'cherry'],
      selectedMultipleText: '{count} fruits chosen',
    })
    expect(displayText(multiple)).toBe('3 fruits chosen')
  })

  it('supports selectedMultipleText as a function of the count', () => {
    const wrapper = mountCombobox({
      multiple: true,
      modelValue: ['apple', 'banana'],
      selectedMultipleText: (count: number) => `Picked ${count}`,
    })

    expect(displayText(wrapper)).toBe('Picked 2')
  })

  it('shows the placeholder when the array is empty or not an array', () => {
    expect(displayText(mountCombobox({ multiple: true, modelValue: [] }))).toBe(
      'Select an option...',
    )
    expect(displayText(mountCombobox({ multiple: true, modelValue: 'apple' }))).toBe(
      'Select an option...',
    )
  })

  it('renders one tag per selected option when showTags is true', () => {
    const wrapper = mountCombobox({
      multiple: true,
      showTags: true,
      modelValue: ['apple', 'cherry'],
    })

    const tags = wrapper.findAll('.base-combobox__tag')
    expect(tags.map((t) => t.text().replace('×', '').trim())).toEqual(['Apple', 'Cherry'])
    expect(wrapper.find('.base-combobox__field--display').exists()).toBe(false)
  })

  it('renders tags for object entries in the modelValue', () => {
    const wrapper = mountCombobox({
      multiple: true,
      showTags: true,
      modelValue: [{ label: 'Dragonfruit', value: 'dragon' }],
    })

    expect(wrapper.find('.base-combobox__tag').text()).toContain('Dragonfruit')
  })

  it('shows the display field instead of tags while nothing is selected', () => {
    const wrapper = mountCombobox({ multiple: true, showTags: true, modelValue: [] })

    expect(wrapper.find('.base-combobox__tags').exists()).toBe(false)
    expect(displayText(wrapper)).toBe('Select an option...')
  })

  it('removes a tag, emitting the remaining values and without opening the menu', async () => {
    const wrapper = mountCombobox({
      multiple: true,
      showTags: true,
      modelValue: ['apple', 'banana', 'cherry'],
    })

    await wrapper.findAll('.base-combobox__tag-remove')[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[['apple', 'cherry']]])
    expect(isOpenClass(wrapper)).toBe(false)
  })

  it('removes the last tag emitting an empty array', async () => {
    const wrapper = mountCombobox({ multiple: true, showTags: true, modelValue: ['apple'] })

    await wrapper.find('.base-combobox__tag-remove').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]])
  })
})

describe('BaseCombobox clear', () => {
  it('does not render the clear container unless clearable', () => {
    expect(
      mountCombobox({ modelValue: 'apple' }).find('.base-combobox__clear-container').exists(),
    ).toBe(false)
  })

  it('reserves the clear container but hides the button without a selection', () => {
    const wrapper = mountCombobox({ clearable: true })

    expect(wrapper.find('.base-combobox__clear-container').exists()).toBe(true)
    expect(wrapper.find('.base-combobox__clear').exists()).toBe(false)
    expect(wrapper.classes()).toContain('base-combobox--with-suffix')
  })

  it('clears a single selection to null and emits clear', async () => {
    const wrapper = mountCombobox({ clearable: true, modelValue: 'apple' })

    await wrapper.find('.base-combobox__clear').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('clears a multiple selection to an empty array', async () => {
    const wrapper = mountCombobox({ clearable: true, multiple: true, modelValue: ['apple'] })

    await wrapper.find('.base-combobox__clear').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('does not open the menu when clearing', async () => {
    const wrapper = mountCombobox({ clearable: true, modelValue: 'apple' })

    await wrapper.find('.base-combobox__clear').trigger('click')
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(false)
  })

  it('hides the clear button when disabled or readonly', () => {
    const disabled = mountCombobox({ clearable: true, modelValue: 'apple', disabled: true })
    expect(disabled.find('.base-combobox__clear').exists()).toBe(false)

    const readonly = mountCombobox({ clearable: true, modelValue: 'apple', readonly: true })
    expect(readonly.find('.base-combobox__clear').exists()).toBe(false)
  })

  it('emits a validation result on clear when validateOnInput is true', async () => {
    const wrapper = mountCombobox({
      clearable: true,
      modelValue: 'apple',
      rules: ['required'],
      validateOnInput: true,
    })

    await wrapper.find('.base-combobox__clear').trigger('click')

    expect(wrapper.emitted('validation')).toEqual([[{ valid: false, error: REQUIRED_MESSAGE }]])
  })
})

describe('BaseCombobox searchable', () => {
  const openAndType = async (wrapper: VueWrapper, text: string): Promise<void> => {
    await openCombobox(wrapper)
    await wrapper.find('input').setValue(text)
    await flushPromises()
  }

  it('emits search and input events as the user types', async () => {
    const wrapper = mountCombobox({ searchable: true })

    await openAndType(wrapper, 'app')

    expect(wrapper.emitted('search')).toEqual([['app']])
    expect(wrapper.emitted('input')).toHaveLength(1)
    expect(wrapper.emitted('input')?.[0][0]).toBeInstanceOf(Event)
  })

  it('filters options case-insensitively by label', async () => {
    const wrapper = mountCombobox({ searchable: true })

    await openAndType(wrapper, 'APP')

    expect(optionLabels()).toEqual(['Apple', 'Pineapple'])
  })

  it('trims the query before filtering', async () => {
    const wrapper = mountCombobox({ searchable: true })

    await openAndType(wrapper, '  banana  ')

    expect(optionLabels()).toEqual(['Banana'])
  })

  it('shows the no-data text when nothing matches', async () => {
    const wrapper = mountCombobox({ searchable: true })

    await openAndType(wrapper, 'zzz')

    expect(getOptionEls()).toHaveLength(0)
    expect(getMenu()?.querySelector('.base-combobox__no-data')?.textContent?.trim()).toBe(
      'No options found',
    )
  })

  it('filters primitive options', async () => {
    const wrapper = mountCombobox({ searchable: true, options: ['red', 'green', 'grey'] })

    await openAndType(wrapper, 'gr')

    expect(optionLabels()).toEqual(['green', 'grey'])
  })

  it('filters by the configured labelKey', async () => {
    const options = [
      { label: 'x', value: 1, name: 'Alpha' },
      { label: 'x', value: 2, name: 'Beta' },
    ]
    const wrapper = mountCombobox({
      searchable: true,
      options,
      labelKey: 'name',
      valueKey: 'value',
    })

    await openAndType(wrapper, 'bet')

    expect(optionLabels()).toEqual(['Beta'])
  })

  it('ignores special characters when removeSpecialChars is true', async () => {
    const options = [
      { label: 'a.b-c', value: 1 },
      { label: 'other', value: 2 },
    ]

    const strict = mountCombobox({ searchable: true, options })
    await openAndType(strict, 'abc')
    expect(optionLabels()).toEqual([])

    strict.unmount()
    wrappers.pop()
    document.body.innerHTML = ''

    const loose = mountCombobox({ searchable: true, options, removeSpecialChars: true })
    await openAndType(loose, 'abc')
    expect(optionLabels()).toEqual(['a.b-c'])
  })

  it('does not filter when the combobox is not searchable', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)

    expect(optionLabels()).toHaveLength(4)
  })

  it('shows the typed query in the input while open, and the selected label when closed', async () => {
    const wrapper = mountCombobox({ searchable: true, modelValue: 'banana' })
    const input = wrapper.find<HTMLInputElement>('input')
    expect(input.element.value).toBe('Banana')

    await openCombobox(wrapper)
    expect(input.element.value).toBe('')

    await input.setValue('che')
    expect(input.element.value).toBe('che')
  })

  it('resets the query when reopened', async () => {
    const wrapper = mountCombobox({ searchable: true })
    await openAndType(wrapper, 'app')
    await press(wrapper, 'Escape')

    await openCombobox(wrapper)

    expect(optionLabels()).toHaveLength(4)
  })

  it('focuses the input when opened', async () => {
    const wrapper = mountCombobox({ searchable: true })

    await openCombobox(wrapper)

    expect(document.activeElement).toBe(wrapper.find('input').element)
    expect(wrapper.emitted('focus')).toHaveLength(1)
    expect(wrapper.classes()).toContain('base-combobox--focused')
  })

  it('selects a filtered option', async () => {
    const wrapper = mountCombobox({ searchable: true })
    await openAndType(wrapper, 'cher')

    await clickOption(0)

    expect(lastModel(wrapper)).toBe('cherry')
  })

  it('emits validation on input when validateOnInput is true', async () => {
    const wrapper = mountCombobox({
      searchable: true,
      rules: ['required'],
      validateOnInput: true,
    })

    await openAndType(wrapper, 'a')

    expect(wrapper.emitted('validation')).toEqual([[{ valid: false, error: REQUIRED_MESSAGE }]])
  })

  it('stays open when the search input of an open combobox is clicked', async () => {
    const wrapper = mountCombobox({ searchable: true })
    const input = wrapper.find('input')

    await input.trigger('click')
    await flushPromises()
    expect(isOpenClass(wrapper)).toBe(true)

    await input.trigger('click')
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(true)
  })

  it('searches options whose label value is a number', async () => {
    const options = [
      { label: 'x', value: 'a', id: 1, name: 123 },
      { label: 'y', value: 'b', id: 2, name: 456 },
    ]
    const errors: unknown[] = []
    const wrapper = mount(BaseCombobox, {
      attachTo: document.body,
      props: { searchable: true, options, labelKey: 'name' },
      global: {
        config: {
          errorHandler: (error: unknown) => {
            errors.push(error)
          },
        },
      },
    })
    wrappers.push(wrapper)
    await openCombobox(wrapper)

    await wrapper.find('input').setValue('12')
    await flushPromises()

    expect(errors).toEqual([])
    expect(optionLabels()).toEqual(['123'])
  })
})

describe('BaseCombobox keyboard', () => {
  it('opens on ArrowDown and prevents the default action', async () => {
    const wrapper = mountCombobox()
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    })

    toggleEl(wrapper).element.dispatchEvent(event)
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(true)
    expect(event.defaultPrevented).toBe(true)
  })

  it('moves the highlight with ArrowDown and ArrowUp, clamped to the list bounds', async () => {
    const wrapper = mountCombobox()
    await press(wrapper, 'ArrowDown') // opens, nothing highlighted yet
    expect(highlightedIndex()).toBe(-1)

    await press(wrapper, 'ArrowDown')
    expect(highlightedIndex()).toBe(0)
    await press(wrapper, 'ArrowDown')
    expect(highlightedIndex()).toBe(1)

    await press(wrapper, 'ArrowUp')
    expect(highlightedIndex()).toBe(0)
    await press(wrapper, 'ArrowUp')
    expect(highlightedIndex()).toBe(-1)
    await press(wrapper, 'ArrowUp')
    expect(highlightedIndex()).toBe(-1)

    for (let i = 0; i < 10; i++) await press(wrapper, 'ArrowDown')
    expect(highlightedIndex()).toBe(3)
  })

  it('ignores ArrowUp while closed', async () => {
    const wrapper = mountCombobox()

    await press(wrapper, 'ArrowUp')

    expect(isOpenClass(wrapper)).toBe(false)
  })

  it('selects the highlighted option on Enter', async () => {
    const wrapper = mountCombobox()
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')
    await press(wrapper, 'ArrowDown')

    await press(wrapper, 'Enter')

    expect(wrapper.emitted('update:modelValue')).toEqual([['banana']])
    expect(wrapper.emitted('select')).toEqual([[FRUITS[1]]])
    expect(isOpenClass(wrapper)).toBe(false)
  })

  it('selects within the filtered list when searching', async () => {
    const wrapper = mountCombobox({ searchable: true })
    await openCombobox(wrapper)
    await wrapper.find('input').setValue('pine')
    await press(wrapper, 'ArrowDown')

    await press(wrapper, 'Enter')

    expect(lastModel(wrapper)).toBe('pineapple')
  })

  it('opens on Enter while closed and prevents the default action', async () => {
    const wrapper = mountCombobox()
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })

    toggleEl(wrapper).element.dispatchEvent(event)
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(true)
    expect(event.defaultPrevented).toBe(true)
  })

  it('does nothing on Enter when open without a highlighted option', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)

    await press(wrapper, 'Enter')

    expect(isOpenClass(wrapper)).toBe(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('closes on Escape and prevents the default action', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })

    toggleEl(wrapper).element.dispatchEvent(event)
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(false)
    expect(isMenuVisible()).toBe(false)
    expect(event.defaultPrevented).toBe(true)
  })

  it('closes on Tab while open without preventing the default action', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })

    toggleEl(wrapper).element.dispatchEvent(event)
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })

  it('ignores unrelated keys', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)

    await press(wrapper, 'a')

    expect(isOpenClass(wrapper)).toBe(true)
  })

  it('ignores every key when disabled or readonly', async () => {
    const disabled = mountCombobox({ disabled: true })
    await press(disabled, 'ArrowDown')
    expect(isOpenClass(disabled)).toBe(false)

    const readonly = mountCombobox({ readonly: true })
    await press(readonly, 'Enter')
    expect(isOpenClass(readonly)).toBe(false)
  })
})

describe('BaseCombobox disabled and readonly', () => {
  it('adds the disabled class and does not open when clicked', async () => {
    const wrapper = mountCombobox({ disabled: true })

    await openCombobox(wrapper)

    expect(wrapper.classes()).toContain('base-combobox--disabled')
    expect(isOpenClass(wrapper)).toBe(false)
    expect(isMenuVisible()).toBe(false)
  })

  it('does not open when readonly', async () => {
    const wrapper = mountCombobox({ readonly: true })

    await openCombobox(wrapper)

    expect(isOpenClass(wrapper)).toBe(false)
  })

  it('reflects disabled and readonly on the searchable input', () => {
    const disabled = mountCombobox({ searchable: true, disabled: true })
    expect(disabled.find('input').attributes('disabled')).toBeDefined()

    const readonly = mountCombobox({ searchable: true, readonly: true })
    expect(readonly.find('input').attributes('readonly')).toBeDefined()
  })

  it('ignores the open() method from the mounted payload', async () => {
    const wrapper = mountCombobox({ disabled: true })

    getApi(wrapper).open()
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(false)
  })
})

describe('BaseCombobox mounted payload and open/close state', () => {
  it('emits mounted once with validate, focus, open and close functions', () => {
    const wrapper = mountCombobox()

    expect(wrapper.emitted('mounted')).toHaveLength(1)
    const api = getApi(wrapper)
    expect(Object.keys(api).sort()).toEqual(['close', 'focus', 'open', 'validate'])
    for (const fn of Object.values(api)) expect(typeof fn).toBe('function')
  })

  it('opens and closes through the exposed open() and close()', async () => {
    const wrapper = mountCombobox()
    const api = getApi(wrapper)

    api.open()
    await flushPromises()
    expect(isOpenClass(wrapper)).toBe(true)
    expect(isMenuVisible()).toBe(true)

    api.close()
    await flushPromises()
    expect(isOpenClass(wrapper)).toBe(false)
    expect(isMenuVisible()).toBe(false)
  })

  it('focuses the wrapper through focus(), or the input when a searchable one is open', async () => {
    const wrapper = mountCombobox()
    getApi(wrapper).focus()
    expect(document.activeElement).toBe(toggleEl(wrapper).element)

    const searchable = mountCombobox({ searchable: true })
    const api = getApi(searchable)
    api.open()
    await flushPromises()
    ;(toggleEl(searchable).element as HTMLElement).focus()
    api.focus()
    expect(document.activeElement).toBe(searchable.find('input').element)
  })

  it('does not emit any open or close event', async () => {
    const wrapper = mountCombobox()

    await openCombobox(wrapper)
    await toggleEl(wrapper).trigger('click')

    expect(wrapper.emitted('open')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('closes and emits blur when clicking outside', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)

    document.body.click()
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(false)
    expect(wrapper.emitted('blur')).toHaveLength(1)
  })

  it('stays open when clicking inside the menu', async () => {
    const wrapper = mountCombobox({ loading: true })
    await openCombobox(wrapper)

    getMenu()?.click()
    await flushPromises()

    expect(isOpenClass(wrapper)).toBe(true)
  })

  it('does not react to outside clicks while closed', async () => {
    const wrapper = mountCombobox()

    document.body.click()
    await flushPromises()

    expect(wrapper.emitted('blur')).toBeUndefined()
  })

  it('stops reacting to outside clicks after unmount', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)
    wrapper.unmount()
    wrappers.pop()

    document.body.click()

    expect(wrapper.emitted('blur')).toBeUndefined()
  })
})

describe('BaseCombobox focus and blur', () => {
  it('emits focus and adds the focused class when the wrapper is focused', async () => {
    const wrapper = mountCombobox()

    await toggleEl(wrapper).trigger('focus')

    expect(wrapper.emitted('focus')).toHaveLength(1)
    expect(wrapper.classes()).toContain('base-combobox--focused')
  })

  it('emits blur and validation when a closed searchable input loses focus', async () => {
    const wrapper = mountCombobox({ searchable: true })
    const input = wrapper.find('input')
    await input.trigger('focus')

    await input.trigger('blur')

    expect(wrapper.emitted('blur')).toHaveLength(1)
    expect(wrapper.emitted('validation')).toEqual([[{ valid: true, error: '' }]])
    expect(wrapper.classes()).not.toContain('base-combobox--focused')
  })

  it('ignores input blur while the menu is open', async () => {
    const wrapper = mountCombobox({ searchable: true })
    await openCombobox(wrapper)

    await wrapper.find('input').trigger('blur')

    expect(wrapper.emitted('blur')).toBeUndefined()
  })

  it('does not emit validation on blur when validateOnBlur is false', async () => {
    const wrapper = mountCombobox({ searchable: true, validateOnBlur: false, rules: ['required'] })
    const input = wrapper.find('input')

    await input.trigger('blur')

    expect(wrapper.emitted('blur')).toHaveLength(1)
    expect(wrapper.emitted('validation')).toBeUndefined()
  })

  it('emits blur when a non-searchable combobox loses focus', async () => {
    const wrapper = mountCombobox()
    const el = toggleEl(wrapper).element as HTMLElement
    el.focus()
    await flushPromises()
    expect(wrapper.emitted('focus')).toHaveLength(1)

    el.blur()
    await flushPromises()

    expect(wrapper.emitted('blur')).toHaveLength(1)
  })
})

describe('BaseCombobox validation', () => {
  it('validate() returns true and reports a valid result when there are no rules', () => {
    const wrapper = mountCombobox({ name: 'fruit' })

    expect(getApi(wrapper).validate()).toBe(true)

    expect(wrapper.emitted('validation')).toEqual([[{ valid: true, error: '', name: 'fruit' }]])
  })

  it('does not enforce the required prop by itself (only rules are validated)', () => {
    const wrapper = mountCombobox({ required: true })

    expect(getApi(wrapper).validate()).toBe(true)
  })

  it('fails the "required" rule when nothing is selected, with the validation payload and UI', async () => {
    const wrapper = mountCombobox({ rules: ['required'], name: 'fruit' })

    expect(getApi(wrapper).validate()).toBe(false)
    await flushPromises()

    expect(wrapper.emitted('validation')).toEqual([
      [{ valid: false, error: REQUIRED_MESSAGE, name: 'fruit' }],
    ])
    expect(wrapper.classes()).toContain('base-combobox--error')
    const helper = wrapper.find('.base-combobox__helper')
    expect(helper.text()).toBe(REQUIRED_MESSAGE)
    expect(helper.classes()).toContain('base-combobox__helper--error')
  })

  it('passes the "required" rule once a value is selected and clears the error', async () => {
    const wrapper = mountCombobox({ rules: ['required'] })
    const api = getApi(wrapper)
    api.validate()
    await flushPromises()
    expect(wrapper.find('.base-combobox__helper').exists()).toBe(true)

    await wrapper.setProps({ modelValue: 'apple' })
    expect(api.validate()).toBe(true)
    await flushPromises()

    expect(wrapper.find('.base-combobox__helper').exists()).toBe(false)
    expect(wrapper.classes()).not.toContain('base-combobox--error')
  })

  it('fails "required" for an empty selection in single mode and passes for a non-empty array', () => {
    const empty = mountCombobox({ rules: ['required'], modelValue: '' })
    expect(getApi(empty).validate()).toBe(false)

    const filled = mountCombobox({ rules: ['required'], multiple: true, modelValue: ['apple'] })
    expect(getApi(filled).validate()).toBe(true)
  })

  it('ignores unknown string rules', () => {
    const wrapper = mountCombobox({ rules: ['unknown-rule'] })

    expect(getApi(wrapper).validate()).toBe(true)
  })

  it('applies the first failing rule, using the rule message for object rules', () => {
    const wrapper = mountCombobox({
      rules: [{ required: true, message: 'Pick one' }, 'required'],
    })

    expect(getApi(wrapper).validate()).toBe(false)

    expect(wrapper.emitted('validation')?.[0][0]).toMatchObject({ valid: false, error: 'Pick one' })
  })

  it('supports min/max length rules on multiple selections', () => {
    const tooFew = mountCombobox({ multiple: true, modelValue: ['apple'], rules: [{ min: 2 }] })
    expect(getApi(tooFew).validate()).toBe(false)
    expect(tooFew.emitted('validation')?.[0][0]).toMatchObject({
      error: 'Must be at least 2 characters',
    })

    const tooMany = mountCombobox({
      multiple: true,
      modelValue: ['apple', 'banana', 'cherry'],
      rules: [{ max: 2, message: 'At most two' }],
    })
    expect(getApi(tooMany).validate()).toBe(false)
    expect(tooMany.emitted('validation')?.[0][0]).toMatchObject({ error: 'At most two' })

    const ok = mountCombobox({
      multiple: true,
      modelValue: ['apple', 'banana'],
      rules: [{ min: 2 }, { max: 2 }],
    })
    expect(getApi(ok).validate()).toBe(true)
  })

  it('supports minValue/maxValue rules on numeric values', () => {
    const low = mountCombobox({ options: [1, 5, 10], modelValue: 1, rules: [{ minValue: 3 }] })
    expect(getApi(low).validate()).toBe(false)

    const high = mountCombobox({ options: [1, 5, 10], modelValue: 10, rules: [{ maxValue: 6 }] })
    expect(getApi(high).validate()).toBe(false)

    const ok = mountCombobox({
      options: [1, 5, 10],
      modelValue: 5,
      rules: [{ minValue: 3 }, { maxValue: 6 }],
    })
    expect(getApi(ok).validate()).toBe(true)
  })

  it('runs a custom validator, using the rule message or a default one', () => {
    const withMessage = mountCombobox({
      modelValue: 'banana',
      rules: [{ validator: (value: unknown) => value === 'apple', message: 'Only apple' }],
    })
    expect(getApi(withMessage).validate()).toBe(false)
    expect(withMessage.emitted('validation')?.[0][0]).toMatchObject({ error: 'Only apple' })

    const withoutMessage = mountCombobox({
      modelValue: 'banana',
      rules: [{ validator: () => false }],
    })
    expect(getApi(withoutMessage).validate()).toBe(false)
    expect(withoutMessage.emitted('validation')?.[0][0]).toMatchObject({ error: 'Invalid value' })

    const passing = mountCombobox({
      modelValue: 'apple',
      rules: [{ validator: (value: unknown) => value === 'apple' }],
    })
    expect(getApi(passing).validate()).toBe(true)
  })

  it('validates on blur by default, without a name in the payload', async () => {
    const wrapper = mountCombobox({ rules: ['required'] })
    await openCombobox(wrapper)

    document.body.click()
    await flushPromises()

    expect(wrapper.emitted('validation')).toEqual([[{ valid: false, error: REQUIRED_MESSAGE }]])
    expect(wrapper.classes()).toContain('base-combobox--error')
  })

  it('does not validate while selecting unless validateOnInput is true', async () => {
    const wrapper = mountCombobox({ rules: ['required'], validateOnBlur: false })
    await openCombobox(wrapper)

    await clickOption(0)

    expect(wrapper.emitted('validation')).toBeUndefined()
  })

  it('validates the newly selected value when validateOnInput is true', async () => {
    const wrapper = mountCombobox({
      rules: ['required'],
      validateOnBlur: false,
      validateOnInput: true,
    })
    await openCombobox(wrapper)

    await clickOption(0)

    expect(wrapper.emitted('validation')).toEqual([[{ valid: true, error: '' }]])
  })

  it('re-validates silently when modelValue changes and validateOnInput is true', async () => {
    const wrapper = mountCombobox({
      rules: ['required'],
      validateOnInput: true,
      modelValue: 'apple',
    })

    await wrapper.setProps({ modelValue: null })

    expect(wrapper.find('.base-combobox__helper').text()).toBe(REQUIRED_MESSAGE)
    expect(wrapper.classes()).toContain('base-combobox--error')
    expect(wrapper.emitted('validation')).toBeUndefined()
  })

  it('fails "required" for an empty array in multiple mode', async () => {
    const wrapper = mountCombobox({
      multiple: true,
      showTags: true,
      rules: ['required'],
      modelValue: ['apple'],
    })
    await wrapper.find('.base-combobox__tag-remove').trigger('click')
    expect(lastModel(wrapper)).toEqual([])
    await wrapper.setProps({ modelValue: [] })

    expect(getApi(wrapper).validate()).toBe(false)
  })

  // BUG: an object rule is only evaluated by its first key, so { message, required } is not enforced
  it.fails('enforces { message, required: true } when message is the first key', () => {
    const wrapper = mountCombobox({ rules: [{ message: 'Pick one', required: true }] })

    expect(getApi(wrapper).validate()).toBe(false)
  })

  it('ignores an empty object rule', () => {
    const wrapper = mountCombobox({ rules: [{}] })

    expect(() => getApi(wrapper).validate()).not.toThrow()
  })
})

describe('BaseCombobox falsy option values', () => {
  const ZERO_OPTIONS: ComboboxOption[] = [
    { label: 'Zero', value: 0 },
    { label: 'One', value: 1 },
  ]

  it('selects an option whose value is 0 by emitting 0', async () => {
    const wrapper = mountCombobox({ options: ZERO_OPTIONS })
    await openCombobox(wrapper)

    await clickOption(0)

    expect(lastModel(wrapper)).toBe(0)
  })

  it('marks the option with value 0 as selected when modelValue is 0', async () => {
    const wrapper = mountCombobox({ options: ZERO_OPTIONS, modelValue: 0 })
    await openCombobox(wrapper)

    expect(getOptionEls()[0].classList.contains('base-combobox__option--selected')).toBe(true)
  })

  it('displays the label of the option whose value is 0', () => {
    const wrapper = mountCombobox({ options: ZERO_OPTIONS, modelValue: 0 })

    expect(displayText(wrapper)).toBe('Zero')
  })

  it('shows the clear button when modelValue is 0', () => {
    const wrapper = mountCombobox({ options: ZERO_OPTIONS, modelValue: 0, clearable: true })

    expect(wrapper.find('.base-combobox__clear').exists()).toBe(true)
  })

  it('passes the required rule when modelValue is 0', () => {
    const wrapper = mountCombobox({ options: ZERO_OPTIONS, modelValue: 0, rules: ['required'] })

    expect(getApi(wrapper).validate()).toBe(true)
  })
})

describe('BaseCombobox teleport and menu sizing', () => {
  it('renders the floating menu in document.body, outside the component, by default', () => {
    const wrapper = mountCombobox()

    const menu = getMenu()
    expect(menu).not.toBeNull()
    expect(wrapper.element.contains(menu)).toBe(false)
    expect(document.body.contains(menu)).toBe(true)
    expect(menu?.classList.contains('vsui')).toBe(true)
    expect(menu?.classList.contains('base-combobox__menu--floating')).toBe(true)
    expect(menu?.hasAttribute('data-vsui-floating')).toBe(true)
  })

  it('renders the menu inside the component without floating markers when teleport is false', () => {
    const wrapper = mountCombobox({ teleport: false })

    const menu = getMenu()
    expect(wrapper.element.contains(menu)).toBe(true)
    expect(menu?.classList.contains('vsui')).toBe(false)
    expect(menu?.classList.contains('base-combobox__menu--floating')).toBe(false)
    expect(menu?.hasAttribute('data-vsui-floating')).toBe(false)
  })

  it('still works end to end when teleport is false', async () => {
    const wrapper = mountCombobox({ teleport: false })

    await openCombobox(wrapper)
    await clickOption(2)

    expect(isOpenClass(wrapper)).toBe(false)
    expect(lastModel(wrapper)).toBe('cherry')
  })

  it('teleports to the selector given by teleportTo', () => {
    const target = document.createElement('div')
    target.id = 'combobox-target'
    document.body.appendChild(target)

    mountCombobox({ teleportTo: '#combobox-target' })

    expect(target.contains(getMenu())).toBe(true)
  })

  it('applies the maxHeight prop to the non-teleported menu', () => {
    mountCombobox({ teleport: false, maxHeight: '300px' })
    expect(getMenu()?.style.maxHeight).toBe('300px')
  })

  it('defaults maxHeight to 200px for the non-teleported menu', () => {
    mountCombobox({ teleport: false })
    expect(getMenu()?.style.maxHeight).toBe('200px')
  })

  it('positions the teleported menu as fixed once opened', async () => {
    const wrapper = mountCombobox()

    await openCombobox(wrapper)

    expect(getMenu()?.style.position).toBe('fixed')
  })

  it('does not apply floating positioning to a non-teleported menu', async () => {
    const wrapper = mountCombobox({ teleport: false })

    await openCombobox(wrapper)

    expect(getMenu()?.style.position).toBe('')
  })

  it('uses minDropdownWidth (200 by default) as the minimum width of the teleported menu', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)
    expect(getMenu()?.style.width).toBe('200px')

    const custom = mountCombobox({ minDropdownWidth: 320 })
    await openCombobox(custom)
    expect(document.querySelectorAll<HTMLElement>('.base-combobox__menu')[1].style.width).toBe(
      '320px',
    )
  })

  it('accepts minDropdownWidth as a numeric string', async () => {
    const wrapper = mountCombobox({ minDropdownWidth: '250' })

    await openCombobox(wrapper)

    expect(getMenu()?.style.width).toBe('250px')
  })

  // BUG: a minDropdownWidth in rem is parsed with parseInt, so '20rem' becomes 20px
  it.fails('does not treat minDropdownWidth "20rem" as 20px', async () => {
    const wrapper = mountCombobox({ minDropdownWidth: '20rem' })

    await openCombobox(wrapper)

    expect(getMenu()?.style.width).not.toBe('20px')
  })
})

describe('BaseCombobox inside BasePopup', () => {
  it('keeps the popup open when Escape closes the combobox menu', async () => {
    const popupOpen = ref(true)
    const Host = defineComponent({
      setup: () => () =>
        h(
          BasePopup,
          {
            modelValue: popupOpen.value,
            'onUpdate:modelValue': (value: boolean) => {
              popupOpen.value = value
            },
          },
          { default: () => h(BaseCombobox, { options: FRUITS }) },
        ),
    })
    wrappers.push(mount(Host, { attachTo: document.body }))

    const toggle = document.body.querySelector<HTMLElement>('.base-combobox__wrapper')
    if (!toggle) throw new Error('combobox not rendered')
    toggle.click()
    await flushPromises()
    expect(document.body.querySelector('.base-combobox--open')).not.toBeNull()

    toggle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    await flushPromises()

    expect(popupOpen.value).toBe(true)
  })

  it('does not close the popup when an option inside it is clicked', async () => {
    const popupOpen = ref(true)
    const Host = defineComponent({
      setup: () => () =>
        h(
          BasePopup,
          {
            modelValue: popupOpen.value,
            'onUpdate:modelValue': (value: boolean) => {
              popupOpen.value = value
            },
          },
          { default: () => h(BaseCombobox, { options: FRUITS }) },
        ),
    })
    wrappers.push(mount(Host, { attachTo: document.body }))
    const toggle = document.body.querySelector<HTMLElement>('.base-combobox__wrapper')
    toggle?.click()
    await flushPromises()

    // The teleported menu is flagged as floating, so BasePopup ignores mousedown on it.
    getOptionEls()[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await flushPromises()

    expect(popupOpen.value).toBe(true)
  })
})

describe('BaseCombobox v-model flow with a parent', () => {
  it('reflects an updated modelValue in the display and the selected option', async () => {
    const wrapper = mountCombobox()
    await openCombobox(wrapper)
    await clickOption(3)

    await wrapper.setProps({ modelValue: lastModel(wrapper) as string })

    expect(displayText(wrapper)).toBe('Pineapple')
  })

  it('logs no Vue errors or warnings for a searchable multiple combobox with tags', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountCombobox({
      searchable: true,
      multiple: true,
      showTags: true,
      clearable: true,
    })

    await openCombobox(wrapper)
    await wrapper.find('input').setValue('a')
    await clickOption(0)

    expect(errors).not.toHaveBeenCalled()
    expect(warnings).not.toHaveBeenCalled()
  })
})
