import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import BaseAccordion from '../../src/components/BaseAccordion.vue'
import BaseAccordionItem from '../../src/components/BaseAccordionItem.vue'

interface ItemDef {
  title: string
  body?: string
  disabled?: boolean
}

type AccordionProps = {
  id?: string
  multiple?: boolean
  variant?: 'default' | 'bordered' | 'minimal'
}

const DEFAULT_ITEMS: ItemDef[] = [
  { title: 'First', body: 'Body 1' },
  { title: 'Second', body: 'Body 2' },
  { title: 'Third', body: 'Body 3' },
]

function mountAccordion(props: AccordionProps = {}, items: ItemDef[] = DEFAULT_ITEMS): VueWrapper {
  return mount(BaseAccordion, {
    props,
    slots: {
      default: () =>
        items.map((item) =>
          h(
            BaseAccordionItem,
            { title: item.title, disabled: item.disabled },
            () => item.body ?? '',
          ),
        ),
    },
  })
}

function headers(wrapper: VueWrapper) {
  return wrapper.findAll('.base-accordion-item__header')
}

function expanded(wrapper: VueWrapper): string[] {
  return headers(wrapper).map((header) => header.attributes('aria-expanded') ?? '')
}

describe('BaseAccordion', () => {
  it('renders a root with the base classes and the default variant', () => {
    const wrapper = mountAccordion()

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining(['vsui', 'base-accordion', 'base-accordion--default']),
    )
  })

  it.each(['default', 'bordered', 'minimal'] as const)(
    'applies the base-accordion--%s root class',
    (variant) => {
      const wrapper = mountAccordion({ variant })

      expect(wrapper.classes()).toContain(`base-accordion--${variant}`)
    },
  )

  it('updates its own root variant class when the variant prop changes', async () => {
    const wrapper = mountAccordion({ variant: 'default' })

    await wrapper.setProps({ variant: 'minimal' })

    expect(wrapper.classes()).toContain('base-accordion--minimal')
    expect(wrapper.classes()).not.toContain('base-accordion--default')
  })

  it('uses the id prop, or generates an "accordion-<n>" id', () => {
    expect(mountAccordion({ id: 'faq' }).attributes('id')).toBe('faq')
    expect(mountAccordion().attributes('id')).toMatch(/^accordion-\d+$/)
  })

  it('renders its default slot', () => {
    const wrapper = mountAccordion()

    expect(wrapper.findAll('.base-accordion-item')).toHaveLength(3)
  })

  it('updates the item variant classes when the variant changes after mount', async () => {
    const wrapper = mountAccordion({ variant: 'default' })

    await wrapper.setProps({ variant: 'bordered' })

    for (const item of wrapper.findAll('.base-accordion-item')) {
      expect(item.classes()).toContain('base-accordion-item--bordered')
    }
  })
})

describe('BaseAccordion single mode (default)', () => {
  it('starts with every item closed', () => {
    const wrapper = mountAccordion()

    expect(expanded(wrapper)).toEqual(['false', 'false', 'false'])
    expect(wrapper.findAll('.base-accordion-item--active')).toHaveLength(0)
  })

  it('opens an item on click and marks it active', async () => {
    const wrapper = mountAccordion()

    await headers(wrapper)[1].trigger('click')

    expect(expanded(wrapper)).toEqual(['false', 'true', 'false'])
    const items = wrapper.findAll('.base-accordion-item')
    expect(items[1].classes()).toContain('base-accordion-item--active')
    expect(items[0].classes()).not.toContain('base-accordion-item--active')
  })

  it('closes the open item when another one is opened', async () => {
    const wrapper = mountAccordion()

    await headers(wrapper)[0].trigger('click')
    await headers(wrapper)[2].trigger('click')

    expect(expanded(wrapper)).toEqual(['false', 'false', 'true'])
  })

  it('closes the open item when it is clicked again', async () => {
    const wrapper = mountAccordion()

    await headers(wrapper)[0].trigger('click')
    await headers(wrapper)[0].trigger('click')

    expect(expanded(wrapper)).toEqual(['false', 'false', 'false'])
    expect(wrapper.findAll('.base-accordion-item--active')).toHaveLength(0)
  })
})

describe('BaseAccordion multiple mode', () => {
  it('keeps several items open at the same time', async () => {
    const wrapper = mountAccordion({ multiple: true })

    await headers(wrapper)[0].trigger('click')
    await headers(wrapper)[2].trigger('click')

    expect(expanded(wrapper)).toEqual(['true', 'false', 'true'])
  })

  it('closes only the clicked item when it is toggled off', async () => {
    const wrapper = mountAccordion({ multiple: true })

    await headers(wrapper)[0].trigger('click')
    await headers(wrapper)[1].trigger('click')
    await headers(wrapper)[0].trigger('click')

    expect(expanded(wrapper)).toEqual(['false', 'true', 'false'])
  })
})

describe('BaseAccordionItem', () => {
  it('renders the title prop in the header and the default slot in the body', () => {
    const wrapper = mountAccordion()

    expect(headers(wrapper)[0].text()).toBe('First')
    expect(wrapper.findAll('.base-accordion-item__body')[0].text()).toBe('Body 1')
  })

  it('keeps the body in the DOM while collapsed (it is collapsed through its height)', () => {
    const wrapper = mountAccordion()

    expect(wrapper.findAll('.base-accordion-item__content')).toHaveLength(3)
    expect(wrapper.findAll('.base-accordion-item__body')[1].text()).toBe('Body 2')
  })

  it('applies the base classes and the accordion variant to each item', () => {
    const wrapper = mountAccordion({ variant: 'bordered' })

    for (const item of wrapper.findAll('.base-accordion-item')) {
      expect(item.classes()).toEqual(
        expect.arrayContaining(['vsui', 'base-accordion-item', 'base-accordion-item--bordered']),
      )
    }
  })

  it('renders the default chevron icon in the header', () => {
    const wrapper = mountAccordion()

    expect(headers(wrapper)[0].find('svg.base-accordion-item__chevron').exists()).toBe(true)
  })

  it('lets the title, icon and chevron slots override the defaults', () => {
    const wrapper = mount(BaseAccordion, {
      slots: {
        default: () =>
          h(
            BaseAccordionItem,
            { title: 'Ignored title' },
            {
              default: () => 'Body',
              title: () => h('strong', { class: 'custom-title' }, 'Custom'),
              icon: () => h('i', { class: 'custom-icon' }),
              chevron: () => h('b', { class: 'custom-chevron' }),
            },
          ),
      },
    })

    const header = wrapper.find('.base-accordion-item__header')
    expect(header.find('.custom-title').text()).toBe('Custom')
    expect(header.text()).not.toContain('Ignored title')
    expect(header.find('.custom-icon').exists()).toBe(true)
    expect(header.find('.custom-chevron').exists()).toBe(true)
    expect(header.find('svg.base-accordion-item__chevron').exists()).toBe(false)
  })

  it('does not render an icon when the icon slot is not provided', () => {
    const wrapper = mountAccordion()

    expect(headers(wrapper)[0].find('.custom-icon').exists()).toBe(false)
    expect(headers(wrapper)[0].findAll('svg')).toHaveLength(1)
  })

  describe('disabled', () => {
    const items: ItemDef[] = [
      { title: 'Locked', body: 'Secret', disabled: true },
      { title: 'Open', body: 'Public' },
    ]

    it('disables the header button and applies the disabled modifier', () => {
      const wrapper = mountAccordion({}, items)

      expect(headers(wrapper)[0].attributes('disabled')).toBeDefined()
      expect(headers(wrapper)[1].attributes('disabled')).toBeUndefined()
      expect(wrapper.findAll('.base-accordion-item')[0].classes()).toContain(
        'base-accordion-item--disabled',
      )
    })

    it('does not open when clicked', async () => {
      const wrapper = mountAccordion({}, items)

      await headers(wrapper)[0].trigger('click')

      expect(expanded(wrapper)).toEqual(['false', 'false'])
    })

    it('does not close other items and still lets enabled items open', async () => {
      const wrapper = mountAccordion({}, items)

      await headers(wrapper)[1].trigger('click')
      await headers(wrapper)[0].trigger('click')

      expect(expanded(wrapper)).toEqual(['false', 'true'])
    })
  })

  describe('outside a BaseAccordion', () => {
    it('renders without throwing', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      expect(() => mount(BaseAccordionItem, { props: { title: 'Standalone' } })).not.toThrow()
    })
  })

  it('renders the header button with type="button"', () => {
    const wrapper = mountAccordion()

    expect(headers(wrapper)[0].attributes('type')).toBe('button')
  })
})
