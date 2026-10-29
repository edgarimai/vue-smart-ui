import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import BaseDropdown from '../../src/components/BaseDropdown.vue'

type DropdownProps = InstanceType<typeof BaseDropdown>['$props']

const wrappers: VueWrapper[] = []

const SLOTS = {
  trigger: '<button class="trigger-btn" type="button">Open</button>',
  default:
    '<div class="item">Item</div>' +
    '<div class="keep" data-prevent-close><span class="keep-inner">Keep</span></div>',
}

function mountDropdown(props: DropdownProps = {}): VueWrapper {
  const wrapper = mount(BaseDropdown, {
    attachTo: document.body,
    props,
    slots: SLOTS,
  })
  wrappers.push(wrapper)
  return wrapper
}

const getMenu = (): HTMLElement | null => document.body.querySelector('.base-dropdown__menu')

const isMenuVisible = (): boolean => {
  const menu = getMenu()
  return menu !== null && menu.style.display !== 'none'
}

const click = (selector: string): void => {
  const target = document.body.querySelector<HTMLElement>(selector)
  if (!target) throw new Error(`Element not found: ${selector}`)
  target.click()
}

const lastEmitted = (wrapper: VueWrapper): unknown => {
  const events = wrapper.emitted('update:modelValue')
  return events?.[events.length - 1]?.[0]
}

afterEach(() => {
  while (wrappers.length) wrappers.pop()?.unmount()
  document.body.innerHTML = ''
})

describe('BaseDropdown rendering', () => {
  it('renders the trigger slot inside the base wrapper', () => {
    const wrapper = mountDropdown()

    expect(wrapper.classes()).toEqual(expect.arrayContaining(['vsui', 'base-dropdown']))
    expect(wrapper.find('.base-dropdown__trigger .trigger-btn').text()).toBe('Open')
  })

  it('uses the id prop on the root element, or generates a dropdown-N id', () => {
    expect(mountDropdown({ id: 'my-dropdown' }).attributes('id')).toBe('my-dropdown')
    expect(mountDropdown().attributes('id')).toMatch(/^dropdown-\d+$/)
  })

  it('is hidden by default and visible when modelValue starts true', () => {
    mountDropdown()
    expect(isMenuVisible()).toBe(false)

    document.body.innerHTML = ''
    mountDropdown({ modelValue: true })
    expect(isMenuVisible()).toBe(true)
  })

  it('renders the default slot inside the menu', () => {
    mountDropdown()

    expect(getMenu()?.querySelector('.item')?.textContent).toBe('Item')
  })

  it.each(['default', 'white', 'dark'] as const)('applies the %s variant class', (variant) => {
    mountDropdown({ variant })

    expect(getMenu()?.classList.contains(`base-dropdown__menu--${variant}`)).toBe(true)
  })

  it('uses the default variant class when no variant is given', () => {
    mountDropdown()

    expect(getMenu()?.classList.contains('base-dropdown__menu--default')).toBe(true)
  })

  it('defaults the menu width to auto and applies a custom width', () => {
    mountDropdown()
    expect(getMenu()?.style.width).toBe('auto')

    document.body.innerHTML = ''
    mountDropdown({ width: '300px', modelValue: true })
    expect(getMenu()?.style.width).toBe('300px')
  })

  it('keeps the custom width after the floating position is computed', async () => {
    const wrapper = mountDropdown({ width: '240px' })

    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    expect(getMenu()?.style.width).toBe('240px')
  })
})

describe('BaseDropdown teleport', () => {
  it('renders the menu in document.body, outside the component root, by default', () => {
    const wrapper = mountDropdown()

    const menu = getMenu()
    expect(menu).not.toBeNull()
    expect(wrapper.element.contains(menu)).toBe(false)
    expect(document.body.contains(menu)).toBe(true)
    expect(menu?.classList.contains('vsui')).toBe(true)
    expect(menu?.classList.contains('base-dropdown__menu--floating')).toBe(true)
    expect(menu?.hasAttribute('data-vsui-floating')).toBe(true)
  })

  it('applies fixed positioning once opened while teleported', async () => {
    const wrapper = mountDropdown()

    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    expect(getMenu()?.style.position).toBe('fixed')
  })

  it('renders the menu inside the component root when teleport is false', () => {
    const wrapper = mountDropdown({ teleport: false })

    const menu = getMenu()
    expect(menu).not.toBeNull()
    expect(wrapper.element.contains(menu)).toBe(true)
    expect(menu?.classList.contains('vsui')).toBe(false)
    expect(menu?.classList.contains('base-dropdown__menu--floating')).toBe(false)
    expect(menu?.hasAttribute('data-vsui-floating')).toBe(false)
  })

  it('does not apply floating styles when teleport is false', async () => {
    const wrapper = mountDropdown({ teleport: false })

    await wrapper.setProps({ modelValue: true })
    await flushPromises()

    expect(getMenu()?.style.position).toBe('')
  })

  it('teleports to the selector given by teleportTo', () => {
    const target = document.createElement('div')
    target.id = 'dropdown-target'
    document.body.appendChild(target)

    mountDropdown({ teleportTo: '#dropdown-target' })

    expect(target.contains(getMenu())).toBe(true)
  })
})

describe('BaseDropdown v-model', () => {
  it('emits update:modelValue(true) when the trigger is clicked while closed', async () => {
    const wrapper = mountDropdown()

    await wrapper.find('.base-dropdown__trigger').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('emits update:modelValue(false) when the trigger is clicked while open', async () => {
    const wrapper = mountDropdown({ modelValue: true })

    await wrapper.find('.base-dropdown__trigger').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('emits when the click lands on an element inside the trigger slot', async () => {
    const wrapper = mountDropdown()

    await wrapper.find('.trigger-btn').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('does not change visibility by itself: it follows the modelValue prop', async () => {
    const wrapper = mountDropdown()

    await wrapper.find('.base-dropdown__trigger').trigger('click')
    expect(isMenuVisible()).toBe(false)

    await wrapper.setProps({ modelValue: true })
    expect(isMenuVisible()).toBe(true)

    await wrapper.setProps({ modelValue: false })
    expect(isMenuVisible()).toBe(false)
  })
})

describe('BaseDropdown closing on item click', () => {
  it('emits update:modelValue(false) when a menu item is clicked', async () => {
    const wrapper = mountDropdown({ modelValue: true })

    click('.item')

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('does not emit when the click target is inside [data-prevent-close]', () => {
    const wrapper = mountDropdown({ modelValue: true })

    click('.keep')
    click('.keep-inner')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not close on item click when closeOnClick is false', () => {
    const wrapper = mountDropdown({ modelValue: true, closeOnClick: false })

    click('.item')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('BaseDropdown click outside', () => {
  it('emits update:modelValue(false) when clicking outside while open', async () => {
    const wrapper = mountDropdown({ modelValue: true })

    document.body.click()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('starts listening for outside clicks once modelValue becomes true', async () => {
    const wrapper = mountDropdown()

    document.body.click()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await wrapper.setProps({ modelValue: true })
    document.body.click()

    expect(lastEmitted(wrapper)).toBe(false)
  })

  it('stops listening for outside clicks once modelValue becomes false', async () => {
    const wrapper = mountDropdown({ modelValue: true })

    await wrapper.setProps({ modelValue: false })
    document.body.click()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not treat clicks inside the trigger or the menu as outside clicks', () => {
    const wrapper = mountDropdown({ modelValue: true, closeOnClick: false })

    click('.trigger-btn')
    expect(lastEmitted(wrapper)).toBe(false) // the trigger itself toggles
    const triggerEmits = wrapper.emitted('update:modelValue')?.length ?? 0

    click('.item')
    expect(wrapper.emitted('update:modelValue')).toHaveLength(triggerEmits)
  })

  it('ignores outside clicks when closeOnClickOutside is false', () => {
    const wrapper = mountDropdown({ modelValue: true, closeOnClickOutside: false })

    document.body.click()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('stops listening after unmount', () => {
    const wrapper = mountDropdown({ modelValue: true })
    wrapper.unmount()
    wrappers.pop()

    document.body.click()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})

describe('BaseDropdown keyboard', () => {
  // BUG: BaseDropdown has no Escape handler, an open dropdown cannot be closed with the keyboard
  it.fails('emits update:modelValue(false) when Escape is pressed while open', () => {
    const wrapper = mountDropdown({ modelValue: true })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })
})
