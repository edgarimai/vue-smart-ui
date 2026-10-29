import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import BasePopup from '../../src/components/BasePopup.vue'

type PopupProps = InstanceType<typeof BasePopup>['$props']

const wrappers: VueWrapper[] = []

function mountPopup(props: PopupProps = {}, slots: Record<string, string> = {}): VueWrapper {
  const wrapper = mount(BasePopup, {
    attachTo: document.body,
    props: { modelValue: true, ...props },
    slots,
  })
  wrappers.push(wrapper)
  return wrapper
}

const query = (selector: string): HTMLElement | null => document.body.querySelector(selector)

const pressKey = (key: string): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

const mouseDown = (target: Element): void => {
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
}

afterEach(() => {
  while (wrappers.length) wrappers.pop()?.unmount()
  document.body.innerHTML = ''
})

describe('BasePopup rendering', () => {
  it('renders nothing while modelValue is false', () => {
    mountPopup({ modelValue: false })

    expect(query('.base-popup-overlay')).toBeNull()
    expect(query('.base-popup')).toBeNull()
  })

  it('teleports the overlay and popup to document.body when modelValue is true', () => {
    const wrapper = mountPopup({}, { default: '<p class="body">Body</p>' })

    const overlay = query('.base-popup-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay?.classList.contains('vsui')).toBe(true)
    expect(overlay?.parentElement).toBe(document.body)
    expect(query('.base-popup')?.parentElement).toBe(overlay)
    expect(query('.base-popup__content .body')?.textContent).toBe('Body')
    expect(wrapper.element.contains(overlay)).toBe(false)
  })

  it('shows and hides when modelValue changes', async () => {
    const wrapper = mountPopup({ modelValue: false })

    await wrapper.setProps({ modelValue: true })
    expect(query('.base-popup')).not.toBeNull()

    await wrapper.setProps({ modelValue: false })
    expect(query('.base-popup')).toBeNull()
  })

  it('applies the default variant, size, position and scroll classes', () => {
    mountPopup()

    expect(Array.from(query('.base-popup')?.classList ?? [])).toEqual([
      'base-popup',
      'base-popup--default',
      'base-popup--medium',
      'base-popup--center',
      'base-popup--scroll-content-only',
    ])
    expect(query('.base-popup-overlay')?.classList.contains('base-popup-overlay--center')).toBe(
      true,
    )
  })

  it.each(['default', 'info', 'success', 'warning', 'error'] as const)(
    'applies the variant class for %s',
    (variant) => {
      mountPopup({ variant })

      expect(query('.base-popup')?.classList.contains(`base-popup--${variant}`)).toBe(true)
    },
  )

  it.each(['small', 'medium', 'large'] as const)('applies the size class for %s', (size) => {
    mountPopup({ size })

    expect(query('.base-popup')?.classList.contains(`base-popup--${size}`)).toBe(true)
  })

  it.each(['center', 'top', 'bottom', 'left', 'right'] as const)(
    'applies the position class to the overlay and popup for %s',
    (position) => {
      mountPopup({ position })

      expect(query('.base-popup')?.classList.contains(`base-popup--${position}`)).toBe(true)
      expect(
        query('.base-popup-overlay')?.classList.contains(`base-popup-overlay--${position}`),
      ).toBe(true)
    },
  )

  it('drops the scroll-content-only class when scrollContentOnly is false', () => {
    mountPopup({ scrollContentOnly: false })

    expect(query('.base-popup')?.classList.contains('base-popup--scroll-content-only')).toBe(false)
  })
})

describe('BasePopup slots', () => {
  it('renders header, default and footer slots in their containers', () => {
    mountPopup(
      {},
      {
        header: '<h2 class="h">Head</h2>',
        default: '<p class="b">Body</p>',
        footer: '<span class="f">Foot</span>',
      },
    )

    expect(query('.base-popup__header .h')?.textContent).toBe('Head')
    expect(query('.base-popup__content .b')?.textContent).toBe('Body')
    expect(query('.base-popup__footer .f')?.textContent).toBe('Foot')
  })

  it('omits header, footer and close containers when their slots are absent', () => {
    mountPopup({}, { default: 'Body' })

    expect(query('.base-popup__content')).not.toBeNull()
    expect(query('.base-popup__header')).toBeNull()
    expect(query('.base-popup__footer')).toBeNull()
    expect(query('.base-popup__close')).toBeNull()
  })

  it('renders the close slot inside a close button', () => {
    mountPopup({}, { close: '<i class="x">x</i>' })

    expect(query('button.base-popup__close .x')).not.toBeNull()
  })

  it('emits update:modelValue(false) when the close button is clicked', () => {
    const wrapper = mountPopup({}, { close: 'x' })

    query('.base-popup__close')?.click()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  // BUG: the close-slot button emits update:modelValue(false) but never emits `close`
  it.fails('emits close when the close button is clicked', () => {
    const wrapper = mountPopup({}, { close: 'x' })

    query('.base-popup__close')?.click()

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('BasePopup Escape key', () => {
  it('emits update:modelValue(false) and close on Escape while open', () => {
    const wrapper = mountPopup()

    pressKey('Escape')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('ignores other keys', () => {
    const wrapper = mountPopup()

    pressKey('Enter')
    pressKey('a')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('ignores Escape when closeOnEsc is false', () => {
    const wrapper = mountPopup({ closeOnEsc: false })

    pressKey('Escape')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('stops listening after unmount', () => {
    const wrapper = mountPopup()
    wrapper.unmount()
    wrappers.pop()

    pressKey('Escape')

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  // BUG: Escape emits update:modelValue(false) and close even when the popup is already closed
  it.fails('does not emit update:modelValue when Escape is pressed while closed', () => {
    const wrapper = mountPopup({ modelValue: false })

    pressKey('Escape')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  // BUG: Escape emits update:modelValue(false) and close even when the popup is already closed
  it.fails('does not emit close when Escape is pressed while closed', () => {
    const wrapper = mountPopup({ modelValue: false })

    pressKey('Escape')

    expect(wrapper.emitted('close')).toBeUndefined()
  })
})

describe('BasePopup click outside', () => {
  it('emits update:modelValue(false) and close on mousedown outside the popup', () => {
    const wrapper = mountPopup()

    const overlay = query('.base-popup-overlay')
    expect(overlay).not.toBeNull()
    mouseDown(overlay as HTMLElement)

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits when the mousedown happens on document.body', () => {
    const wrapper = mountPopup()

    mouseDown(document.body)

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not emit on mousedown inside the popup', () => {
    const wrapper = mountPopup({}, { default: '<p class="b">Body</p>' })

    mouseDown(query('.b') as HTMLElement)
    mouseDown(query('.base-popup') as HTMLElement)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('does not emit on click (only mousedown counts)', () => {
    const wrapper = mountPopup()

    document.body.click()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not emit when the mousedown target is inside another floating element', () => {
    const wrapper = mountPopup()
    const floating = document.createElement('div')
    floating.setAttribute('data-vsui-floating', '')
    const inner = document.createElement('span')
    floating.appendChild(inner)
    document.body.appendChild(floating)

    mouseDown(inner)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('does not emit when the mousedown target is inside another popup', () => {
    const wrapper = mountPopup()
    const other = document.createElement('div')
    other.className = 'base-popup'
    const inner = document.createElement('span')
    other.appendChild(inner)
    document.body.appendChild(other)

    mouseDown(inner)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not emit on outside mousedown when disableClickOutside is true', () => {
    const wrapper = mountPopup({ disableClickOutside: true })

    mouseDown(query('.base-popup-overlay') as HTMLElement)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('does not emit on outside mousedown while closed', () => {
    const wrapper = mountPopup({ modelValue: false })

    mouseDown(document.body)

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('stops listening after unmount', () => {
    const wrapper = mountPopup()
    wrapper.unmount()
    wrappers.pop()

    mouseDown(document.body)

    expect(wrapper.emitted('close')).toBeUndefined()
  })
})
