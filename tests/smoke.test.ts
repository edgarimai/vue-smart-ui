import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import { mount } from '@vue/test-utils'
import VueSmartUI, { BaseButton, useValidationConfig } from '../src'

const COMPONENT_NAMES = [
  'BaseAccordion',
  'BaseAccordionItem',
  'BaseAvatar',
  'BaseButton',
  'BaseCheckbox',
  'BaseColorPicker',
  'BaseCombobox',
  'BaseDropdown',
  'BaseInfiniteScroll',
  'BaseInput',
  'BaseOTP',
  'BasePopup',
  'BaseSegmentedButtons',
  'BaseSkeleton',
  'BaseSlider',
  'BaseSwitch',
  'BaseTable',
  'BaseTextarea',
  'BaseToast',
  'ToastsContainer',
]

describe('plugin', () => {
  it('registers every public component globally', () => {
    const app = createApp({})
    app.use(VueSmartUI)

    for (const name of COMPONENT_NAMES) {
      expect(app.component(name), name).toBeDefined()
    }
  })
})

describe('BaseButton', () => {
  it('renders its default slot and the base classes', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Save' } })

    expect(wrapper.text()).toBe('Save')
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['vsui', 'base-button', 'base-button--primary']),
    )
  })

  it('emits click', async () => {
    const wrapper = mount(BaseButton)

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click while disabled', async () => {
    const wrapper = mount(BaseButton, { props: { disabled: true } })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

describe('useValidationConfig', () => {
  const { setValidationMessages, resetValidationMessages, getValidationMessage } =
    useValidationConfig()

  afterEach(() => resetValidationMessages())

  it('returns the default messages, resolving function messages with their param', () => {
    expect(getValidationMessage('required')).toBe('This field is required')
    expect(getValidationMessage('min', 3)).toBe('Must be at least 3 characters')
  })

  it('applies custom messages and restores the defaults on reset', () => {
    setValidationMessages({ required: 'Obrigatório' })
    expect(getValidationMessage('required')).toBe('Obrigatório')

    resetValidationMessages()
    expect(getValidationMessage('required')).toBe('This field is required')
  })
})
