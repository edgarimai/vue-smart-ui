import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import BaseAvatar from '../../src/components/BaseAvatar.vue'

type AvatarProps = InstanceType<typeof BaseAvatar>['$props']

enableAutoUnmount(afterEach)

function mountAvatar(props: AvatarProps = {}, slots: Record<string, string> = {}): VueWrapper {
  return mount(BaseAvatar, { props, slots })
}

function initials(wrapper: VueWrapper): string {
  return wrapper.find('.base-avatar__initials').text()
}

describe('BaseAvatar', () => {
  describe('rendering', () => {
    it('renders the base classes with the default variant, size and shape', () => {
      const wrapper = mountAvatar()

      expect(wrapper.classes()).toEqual(
        expect.arrayContaining([
          'vsui',
          'base-avatar',
          'base-avatar--default',
          'base-avatar--medium',
          'base-avatar--circle',
        ]),
      )
      expect(wrapper.classes()).not.toContain('base-avatar--has-image')
      expect(wrapper.classes()).not.toContain('base-avatar--disabled')
    })

    it.each(['default', 'filled', 'outlined'] as const)(
      'applies the %s variant class',
      (variant) => {
        expect(mountAvatar({ variant }).classes()).toContain(`base-avatar--${variant}`)
      },
    )

    it.each(['small', 'medium', 'large', 'xlarge'] as const)(
      'applies the %s size class',
      (size) => {
        expect(mountAvatar({ size }).classes()).toContain(`base-avatar--${size}`)
      },
    )

    it.each(['circle', 'square', 'rounded'] as const)('applies the %s shape class', (shape) => {
      expect(mountAvatar({ shape }).classes()).toContain(`base-avatar--${shape}`)
    })

    it('applies the disabled class', () => {
      expect(mountAvatar({ disabled: true }).classes()).toContain('base-avatar--disabled')
    })

    it('uses the id prop and generates one otherwise', () => {
      expect(mountAvatar({ id: 'me' }).attributes('id')).toBe('me')
      expect(mountAvatar().attributes('id')).toMatch(/^avatar-\d+$/)
    })

    it('uses name, then alt, as the title', () => {
      expect(mountAvatar({ name: 'Jane Doe', alt: 'Photo' }).attributes('title')).toBe('Jane Doe')
      expect(mountAvatar({ alt: 'Photo' }).attributes('title')).toBe('Photo')
    })

    it('renders the default slot content', () => {
      const wrapper = mountAvatar({}, { default: '<span class="badge">3</span>' })

      expect(wrapper.find('.badge').text()).toBe('3')
    })
  })

  describe('image', () => {
    it('renders the image when src is set and no initials', () => {
      const wrapper = mountAvatar({ src: 'https://example.com/a.png', name: 'Jane Doe' })
      const img = wrapper.find('img.base-avatar__image')

      expect(img.attributes('src')).toBe('https://example.com/a.png')
      expect(wrapper.find('.base-avatar__initials').exists()).toBe(false)
      expect(wrapper.classes()).toContain('base-avatar--has-image')
    })

    it('uses alt for the image alt text, falling back to name', () => {
      expect(
        mountAvatar({ src: '/a.png', alt: 'Profile photo', name: 'Jane' })
          .find('img')
          .attributes('alt'),
      ).toBe('Profile photo')
      expect(mountAvatar({ src: '/a.png', name: 'Jane' }).find('img').attributes('alt')).toBe(
        'Jane',
      )
    })

    it('emits load with the event', async () => {
      const wrapper = mountAvatar({ src: '/a.png' })

      await wrapper.find('img').trigger('load')

      expect(wrapper.emitted('load')).toHaveLength(1)
      expect(wrapper.emitted('load')?.[0][0]).toBeInstanceOf(Event)
    })

    it('emits error with the event when the image fails', async () => {
      const wrapper = mountAvatar({ src: '/broken.png' })

      await wrapper.find('img').trigger('error')

      expect(wrapper.emitted('error')).toHaveLength(1)
      expect(wrapper.emitted('error')?.[0][0]).toBeInstanceOf(Event)
    })

    it('renders no image when src is empty or null', () => {
      expect(mountAvatar({ src: '' }).find('img').exists()).toBe(false)
      expect(mountAvatar({ src: null }).find('img').exists()).toBe(false)
    })
  })

  describe('initials', () => {
    it('renders ? when there is neither a name nor a fallback', () => {
      expect(initials(mountAvatar())).toBe('?')
    })

    it('uses the first letter of a single word name, uppercased', () => {
      expect(initials(mountAvatar({ name: 'john' }))).toBe('J')
    })

    it('uses the first letters of the first and last words', () => {
      expect(initials(mountAvatar({ name: 'John Doe' }))).toBe('JD')
      expect(initials(mountAvatar({ name: 'john michael doe' }))).toBe('JD')
    })

    it('trims the name before computing initials', () => {
      expect(initials(mountAvatar({ name: '  John Doe  ' }))).toBe('JD')
    })

    it('uses the fallback text when there is no name', () => {
      expect(initials(mountAvatar({ fallback: 'Ana Maria' }))).toBe('AM')
      expect(initials(mountAvatar({ fallback: 'zed' }))).toBe('Z')
    })

    it('prefers the name over the fallback', () => {
      expect(initials(mountAvatar({ name: 'John Doe', fallback: 'XY' }))).toBe('JD')
    })

    it('handles double spaces between words', () => {
      expect(initials(mountAvatar({ name: 'John  Doe' }))).toBe('JD')
    })
  })

  describe('status', () => {
    it('renders no status indicator by default', () => {
      expect(mountAvatar().find('.base-avatar__status').exists()).toBe(false)
    })

    it.each(['online', 'offline', 'away', 'busy'] as const)(
      'renders the %s status indicator',
      (status) => {
        const wrapper = mountAvatar({ status })

        expect(wrapper.find('.base-avatar__status').classes()).toContain(
          `base-avatar__status--${status}`,
        )
      },
    )

    it('hides the status indicator while disabled', () => {
      expect(
        mountAvatar({ status: 'online', disabled: true }).find('.base-avatar__status').exists(),
      ).toBe(false)
    })
  })

  describe('known defects', () => {
    // BUG: a broken image only emits `error`; the avatar does not fall back to initials
    it.fails('falls back to initials when the image fails to load', async () => {
      const wrapper = mountAvatar({ src: '/broken.png', name: 'Jane Doe' })

      await wrapper.find('img').trigger('error')

      expect(wrapper.find('img').exists()).toBe(false)
      expect(initials(wrapper)).toBe('JD')
    })

    // BUG: an initials-only avatar has no role or accessible name for assistive tech
    it.fails('exposes an accessible name for an initials-only avatar', () => {
      const wrapper = mountAvatar({ name: 'Jane Doe' })

      expect(wrapper.attributes('role')).toBe('img')
      expect(wrapper.attributes('aria-label')).toBe('Jane Doe')
    })
  })
})
