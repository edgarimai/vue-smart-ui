import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '../../src/components/BaseButton.vue'

const VARIANTS = [
  'primary',
  'secondary',
  'gray',
  'white',
  'outline',
  'outline-red',
  'ghost',
] as const
const SIZES = ['small', 'medium', 'large', 'auto'] as const

describe('BaseButton props and classes', () => {
  it('renders a <button> with the base classes, the primary variant and the medium size by default', () => {
    const wrapper = mount(BaseButton)

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'vsui',
        'base-button',
        'base-button--primary',
        'base-button--medium',
      ]),
    )
    expect(wrapper.classes()).not.toContain('base-button--block')
    expect(wrapper.classes()).not.toContain('base-button--disabled')
    expect(wrapper.classes()).not.toContain('base-button--icon-only')
    expect(wrapper.classes()).not.toContain('base-button--loading')
    expect(wrapper.classes()).not.toContain('base-button--hide-focus-outline')
  })

  it.each(VARIANTS)('applies the base-button--%s class for variant "%s"', (variant) => {
    const wrapper = mount(BaseButton, { props: { variant } })

    expect(wrapper.classes()).toContain(`base-button--${variant}`)
    for (const other of VARIANTS.filter((v) => v !== variant)) {
      expect(wrapper.classes()).not.toContain(`base-button--${other}`)
    }
  })

  it.each(SIZES)('applies the base-button--%s class for size "%s"', (size) => {
    const wrapper = mount(BaseButton, { props: { size } })

    expect(wrapper.classes()).toContain(`base-button--${size}`)
  })

  it('applies the block modifier', () => {
    const wrapper = mount(BaseButton, { props: { block: true } })

    expect(wrapper.classes()).toContain('base-button--block')
  })

  it('applies the icon-only modifier', () => {
    const wrapper = mount(BaseButton, { props: { iconOnly: true } })

    expect(wrapper.classes()).toContain('base-button--icon-only')
  })

  it('applies the hide-focus-outline modifier', () => {
    const wrapper = mount(BaseButton, { props: { hideFocusOutline: true } })

    expect(wrapper.classes()).toContain('base-button--hide-focus-outline')
  })

  it('sets the disabled attribute and the disabled modifier when disabled', () => {
    const wrapper = mount(BaseButton, { props: { disabled: true } })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('base-button--disabled')
  })

  it('is not disabled by default', () => {
    const wrapper = mount(BaseButton)

    expect(wrapper.attributes('disabled')).toBeUndefined()
  })
})

describe('BaseButton loading', () => {
  it('shows a spinner, hides the content and applies the loading modifier', () => {
    const wrapper = mount(BaseButton, { props: { loading: true }, slots: { default: 'Save' } })

    expect(wrapper.classes()).toContain('base-button--loading')
    expect(wrapper.find('.spinner').exists()).toBe(true)
    // The label stays in the DOM (keeps the button width) but is visually hidden.
    expect(wrapper.find('.button-content').classes()).toContain('hidden')
    expect(wrapper.find('.button-content').text()).toBe('Save')
  })

  it('has no spinner and visible content when not loading', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Save' } })

    expect(wrapper.find('.spinner').exists()).toBe(false)
    expect(wrapper.find('.button-content').classes()).not.toContain('hidden')
  })

  // BUG: loading only blocks pointer events via CSS; a click is still emitted (keyboard/programmatic)
  it.fails('does not emit click while loading', async () => {
    const wrapper = mount(BaseButton, { props: { loading: true } })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

describe('BaseButton click', () => {
  it('emits click with the native MouseEvent as payload', async () => {
    const wrapper = mount(BaseButton)

    await wrapper.trigger('click')

    const events = wrapper.emitted('click')
    expect(events).toHaveLength(1)
    expect(events?.[0]?.[0]).toBeInstanceOf(MouseEvent)
  })

  it('emits one click per click', async () => {
    const wrapper = mount(BaseButton)

    await wrapper.trigger('click')
    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(2)
  })
})

describe('BaseButton slots', () => {
  it('renders prefix, default and suffix slots in that order inside .button-content', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        prefix: '<i class="pre">P</i>',
        default: '<span class="main">Label</span>',
        suffix: '<i class="suf">S</i>',
      },
    })

    const content = wrapper.find('.button-content')
    const children = Array.from(content.element.children).map((el) => el.className)
    expect(children).toEqual(['pre', 'main', 'suf'])
  })

  it('renders only the default slot when prefix and suffix are not provided', () => {
    const wrapper = mount(BaseButton, { slots: { default: '<span class="main">Label</span>' } })

    expect(wrapper.find('.button-content').element.children).toHaveLength(1)
    expect(wrapper.find('.main').exists()).toBe(true)
  })

  it('renders prefix and suffix without a default slot', () => {
    const wrapper = mount(BaseButton, {
      slots: { prefix: '<i class="pre"></i>', suffix: '<i class="suf"></i>' },
    })

    expect(wrapper.find('.pre').exists()).toBe(true)
    expect(wrapper.find('.suf').exists()).toBe(true)
  })
})

describe('BaseButton id', () => {
  it('uses the id prop when provided', () => {
    const wrapper = mount(BaseButton, { props: { id: 'save-btn' } })

    expect(wrapper.attributes('id')).toBe('save-btn')
  })

  it('generates a "button-<n>" id when no id is provided', () => {
    const wrapper = mount(BaseButton)

    expect(wrapper.attributes('id')).toMatch(/^button-\d+$/)
  })

  it('generates a distinct id for each instance', () => {
    const first = mount(BaseButton)
    const second = mount(BaseButton)

    expect(first.attributes('id')).not.toBe(second.attributes('id'))
  })
})

describe('BaseButton attrs', () => {
  it('merges a custom class with the component classes', () => {
    const wrapper = mount(BaseButton, { attrs: { class: 'custom-class' } })

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['base-button', 'base-button--primary', 'custom-class']),
    )
  })

  it('forwards title, aria-label and data-* attributes to the <button>', () => {
    const wrapper = mount(BaseButton, {
      attrs: { title: 'Save changes', 'aria-label': 'Save', 'data-testid': 'save' },
    })

    expect(wrapper.attributes('title')).toBe('Save changes')
    expect(wrapper.attributes('aria-label')).toBe('Save')
    expect(wrapper.attributes('data-testid')).toBe('save')
  })

  it('forwards an inline style to the <button>', () => {
    const wrapper = mount(BaseButton, { attrs: { style: 'color: red' } })

    expect(wrapper.attributes('style')).toContain('color: red')
  })
})

describe('BaseButton type', () => {
  it('does not render a type attribute even though the prop defaults to "button"', () => {
    // Characterization of CURRENT behavior: the `type` prop is declared but never bound to the
    // <button>. Rendering it would be a behavior change for consumers: buttons inside a <form>
    // currently fall back to the browser default (type="submit") and submit the form.
    const wrapper = mount(BaseButton)
    const submit = mount(BaseButton, { props: { type: 'submit' } })

    expect(wrapper.attributes('type')).toBeUndefined()
    expect(submit.attributes('type')).toBeUndefined()
  })
})
