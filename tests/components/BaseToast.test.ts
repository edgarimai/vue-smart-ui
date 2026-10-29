import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import BaseToast from '../../src/components/BaseToast.vue'
import type { ToastPosition } from '../../src/composables/toastConfig'

type ToastProps = InstanceType<typeof BaseToast>['$props']

const DEFAULT_TOAST_DEFAULTS = {
  position: 'top-right',
  duration: 3000,
  closable: true,
  simple: false,
}

const wrappers: VueWrapper[] = []

function mountToast(props: Partial<ToastProps> = {}): VueWrapper {
  const wrapper = mount(BaseToast, {
    attachTo: document.body,
    props: { id: 1, message: 'Saved', ...props },
  })
  wrappers.push(wrapper)
  return wrapper
}

// The toast composables keep module-level state (id counter, toasts list, singleton
// container, defaults), so every test that needs a clean slate loads a fresh module graph.
async function loadToast() {
  vi.resetModules()
  const { useToast } = await import('../../src/composables/toast')
  const { useToastConfig } = await import('../../src/composables/toastConfig')
  return { toast: useToast(), config: useToastConfig() }
}

const containerCount = (): number => document.querySelectorAll('#toast-container').length

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  while (wrappers.length) wrappers.pop()?.unmount()
  vi.clearAllTimers()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('BaseToast rendering', () => {
  it('renders the message and the default classes', () => {
    const wrapper = mountToast()

    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'vsui',
        'base-toast',
        'base-toast--default',
        'base-toast--top-right',
      ]),
    )
    expect(wrapper.find('.base-toast__message').text()).toBe('Saved')
    expect(wrapper.attributes('data-toast-id')).toBe('1')
  })

  it('renders the title above the message when provided', () => {
    const wrapper = mountToast({ title: 'Done' })

    expect(wrapper.find('.base-toast__title').text()).toBe('Done')
  })

  it('does not render a title element when the title is empty', () => {
    const wrapper = mountToast()

    expect(wrapper.find('.base-toast__title').exists()).toBe(false)
  })

  it.each(['default', 'success', 'error', 'info', 'warning'] as const)(
    'applies variant classes and an icon for %s',
    (variant) => {
      const wrapper = mountToast({ variant })

      expect(wrapper.classes()).toContain(`base-toast--${variant}`)
      expect(wrapper.find('.base-toast__icon .icon').exists()).toBe(true)
      expect(wrapper.find('.progress-bar').classes()).toContain(`progress-bar--${variant}`)
    },
  )

  it('uses the info icon for the default variant and distinct icons for the other variants', () => {
    const iconHtml = (variant: NonNullable<ToastProps['variant']>): string =>
      mountToast({ variant }).find('.base-toast__icon').html()

    const html = {
      default: iconHtml('default'),
      info: iconHtml('info'),
      success: iconHtml('success'),
      error: iconHtml('error'),
      warning: iconHtml('warning'),
    }

    expect(html.default).toBe(html.info)
    expect(new Set([html.info, html.success, html.error, html.warning]).size).toBe(4)
  })

  it.each([
    'top-right',
    'top-left',
    'top-center',
    'bottom-right',
    'bottom-left',
    'bottom-center',
  ] as const satisfies readonly ToastPosition[])(
    'applies the position class for %s',
    (position) => {
      const wrapper = mountToast({ position })

      expect(wrapper.classes()).toContain(`base-toast--${position}`)
    },
  )

  it('becomes visible after the entrance delay', async () => {
    const wrapper = mountToast()
    expect(wrapper.classes()).not.toContain('base-toast--visible')

    await vi.advanceTimersByTimeAsync(100)

    expect(wrapper.classes()).toContain('base-toast--visible')
  })

  it('renders a progress bar whose animation duration matches the duration prop', () => {
    const wrapper = mountToast({ duration: 1500 })

    expect(wrapper.find('.progress-bar').attributes('style')).toContain(
      'animation-duration: 1500ms',
    )
  })

  it('omits the progress bar when duration is 0', () => {
    const wrapper = mountToast({ duration: 0 })

    expect(wrapper.find('.progress-bar').exists()).toBe(false)
  })

  it('renders a close button by default and omits it when closable is false', () => {
    expect(mountToast().find('button.base-toast__close').exists()).toBe(true)
    expect(mountToast({ closable: false }).find('.base-toast__close').exists()).toBe(false)
  })

  it('renders a simple toast without icon, title and progress bar', () => {
    const wrapper = mountToast({ simple: true, title: 'Hidden' })

    expect(wrapper.classes()).toContain('base-toast--simple')
    expect(wrapper.find('.base-toast__icon').exists()).toBe(false)
    expect(wrapper.find('.base-toast__title').exists()).toBe(false)
    expect(wrapper.find('.progress-bar').exists()).toBe(false)
    expect(wrapper.find('.base-toast__message').text()).toBe('Saved')
  })

  it('still renders the close button on a simple toast', () => {
    expect(mountToast({ simple: true }).find('.base-toast__close').exists()).toBe(true)
  })
})

describe('BaseToast closing', () => {
  it('hides immediately and emits close after the exit animation when the button is clicked', async () => {
    const wrapper = mountToast()
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.classes()).toContain('base-toast--visible')

    await wrapper.find('.base-toast__close').trigger('click')

    expect(wrapper.classes()).not.toContain('base-toast--visible')
    expect(wrapper.emitted('close')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(100)

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes when the progress bar animation ends', async () => {
    const wrapper = mountToast()

    wrapper.find('.progress-bar').element.dispatchEvent(new Event('animationend'))
    await vi.advanceTimersByTimeAsync(100)

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes after the duration when simple, using its own timer', async () => {
    const wrapper = mountToast({ simple: true, duration: 1000 })

    await vi.advanceTimersByTimeAsync(999)
    expect(wrapper.emitted('close')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(1 + 100)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('never auto-closes a simple toast with duration 0', async () => {
    const wrapper = mountToast({ simple: true, duration: 0 })

    await vi.advanceTimersByTimeAsync(60_000)

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('never auto-closes a regular toast with duration 0', async () => {
    const wrapper = mountToast({ duration: 0 })

    await vi.advanceTimersByTimeAsync(60_000)

    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('closes after duration even if no animationend event is fired', async () => {
    const wrapper = mountToast({ duration: 1000 })

    await vi.advanceTimersByTimeAsync(1000 + 100)

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('leaves no pending timers after a simple toast is unmounted', async () => {
    const wrapper = mountToast({ simple: true, duration: 5000 })
    await vi.advanceTimersByTimeAsync(100)

    wrapper.unmount()
    wrappers.pop()

    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('useToastConfig', () => {
  it('exposes the built-in defaults', async () => {
    const { config } = await loadToast()

    expect(config.getToastDefaults()).toEqual(DEFAULT_TOAST_DEFAULTS)
  })

  it('applies a full or partial override with setToastDefaults', async () => {
    const { config } = await loadToast()

    config.setToastDefaults({ position: 'bottom-left', duration: 500 })

    expect(config.getToastDefaults()).toEqual({
      position: 'bottom-left',
      duration: 500,
      closable: true,
      simple: false,
    })
  })

  it('restores the built-in defaults with resetToastDefaults', async () => {
    const { config } = await loadToast()
    config.setToastDefaults({ position: 'top-center', duration: 1, closable: false, simple: true })

    config.resetToastDefaults()

    expect(config.getToastDefaults()).toEqual(DEFAULT_TOAST_DEFAULTS)
  })

  it('returns a copy from getToastDefaults', async () => {
    const { config } = await loadToast()

    const copy = config.getToastDefaults()
    copy.duration = 1

    expect(config.getToastDefaults().duration).toBe(3000)
  })

  it('exposes the reactive toastConfig state', async () => {
    const { config } = await loadToast()

    config.setToastDefaults({ simple: true })

    expect(config.toastConfig.defaults.simple).toBe(true)
  })

  it('shares state between separate useToastConfig() calls', async () => {
    const { config } = await loadToast()
    const { useToastConfig } = await import('../../src/composables/toastConfig')

    config.setToastDefaults({ duration: 42 })

    expect(useToastConfig().getToastDefaults().duration).toBe(42)
  })

  it('keeps previously set defaults when called again with another partial', async () => {
    const { config } = await loadToast()

    config.setToastDefaults({ position: 'bottom-left' })
    config.setToastDefaults({ duration: 1000 })

    expect(config.getToastDefaults()).toEqual({
      position: 'bottom-left',
      duration: 1000,
      closable: true,
      simple: false,
    })
  })
})

describe('useToast', () => {
  it('creates a toast with the built-in defaults and returns its id', async () => {
    const { toast } = await loadToast()

    const id = toast.addToast({ message: 'Hello' })

    expect(id).toBe(1)
    expect(toast.toasts.value).toEqual([
      {
        id: 1,
        message: 'Hello',
        title: '',
        variant: 'default',
        position: 'top-right',
        duration: 3000,
        closable: true,
        simple: false,
      },
    ])
  })

  it('returns incrementing ids and never reuses them after removal', async () => {
    const { toast } = await loadToast()

    const first = toast.info('a')
    const second = toast.info('b')
    toast.removeToast(second)
    const third = toast.info('c')

    expect([first, second, third]).toEqual([1, 2, 3])
  })

  it('shares the toasts list between useToast() calls', async () => {
    const { toast } = await loadToast()
    const { useToast } = await import('../../src/composables/toast')

    toast.info('shared')

    expect(useToast().toasts.value.map((t) => t.message)).toEqual(['shared'])
  })

  it.each(['default', 'success', 'error', 'info', 'warning'] as const)(
    'the %s convenience method sets the variant and message',
    async (variant) => {
      const { toast } = await loadToast()

      const id = toast[variant]('Message')

      expect(id).toBe(1)
      expect(toast.toasts.value[0]).toMatchObject({ id: 1, message: 'Message', variant })
    },
  )

  it('lets convenience methods override title, position, duration, closable and simple', async () => {
    const { toast } = await loadToast()

    toast.success('Msg', {
      title: 'Title',
      position: 'bottom-center',
      duration: 1234,
      closable: false,
      simple: true,
    })

    expect(toast.toasts.value[0]).toEqual({
      id: 1,
      message: 'Msg',
      title: 'Title',
      variant: 'success',
      position: 'bottom-center',
      duration: 1234,
      closable: false,
      simple: true,
    })
  })

  it('forces the variant of a convenience method over options.variant', async () => {
    const { toast } = await loadToast()

    toast.error('Msg', { variant: 'success' })

    expect(toast.toasts.value[0].variant).toBe('error')
  })

  it('accepts an explicit variant through addToast', async () => {
    const { toast } = await loadToast()

    toast.addToast({ message: 'Msg', variant: 'warning' })

    expect(toast.toasts.value[0].variant).toBe('warning')
  })

  it('falls back to the configured defaults for options that were not given', async () => {
    const { toast, config } = await loadToast()
    config.setToastDefaults({
      position: 'bottom-right',
      duration: 500,
      closable: false,
      simple: true,
    })

    toast.info('Msg')

    expect(toast.toasts.value[0]).toMatchObject({
      position: 'bottom-right',
      duration: 500,
      closable: false,
      simple: true,
    })
  })

  it('prefers explicit options over configured defaults, including falsy values', async () => {
    const { toast, config } = await loadToast()
    config.setToastDefaults({ duration: 500, closable: false, simple: true })

    toast.info('Msg', { duration: 0, closable: true, simple: false })

    expect(toast.toasts.value[0]).toMatchObject({ duration: 0, closable: true, simple: false })
  })

  it('reads the defaults at creation time, not at call-site setup', async () => {
    const { toast, config } = await loadToast()

    toast.info('before')
    config.setToastDefaults({ position: 'top-left' })
    toast.info('after')

    expect(toast.toasts.value.map((t) => t.position)).toEqual(['top-right', 'top-left'])
  })

  it('goes back to the built-in defaults after resetToastDefaults', async () => {
    const { toast, config } = await loadToast()
    config.setToastDefaults({ position: 'top-left', duration: 1 })
    config.resetToastDefaults()

    toast.info('Msg')

    expect(toast.toasts.value[0]).toMatchObject({ position: 'top-right', duration: 3000 })
  })

  it('removes a toast by id and ignores unknown ids', async () => {
    const { toast } = await loadToast()
    const a = toast.info('a')
    const b = toast.info('b')

    toast.removeToast(a)
    expect(toast.toasts.value.map((t) => t.id)).toEqual([b])

    toast.removeToast(999)
    expect(toast.toasts.value.map((t) => t.id)).toEqual([b])
  })
})

describe('toast container', () => {
  it('is not created until the first toast is added', async () => {
    const { toast } = await loadToast()
    expect(containerCount()).toBe(0)

    toast.info('First')

    expect(containerCount()).toBe(1)
    expect(document.querySelector('#toast-container')?.parentElement).toBe(document.body)
  })

  it('is mounted only once no matter how many toasts are added', async () => {
    const { toast } = await loadToast()

    toast.info('a')
    toast.success('b')
    toast.addToast({ message: 'c' })
    await nextTick()

    expect(containerCount()).toBe(1)
  })

  it('is shared by separate useToast() calls', async () => {
    const { toast } = await loadToast()
    const { useToast } = await import('../../src/composables/toast')

    toast.info('a')
    useToast().info('b')

    expect(containerCount()).toBe(1)
  })

  it('renders each toast with its message inside a position group', async () => {
    const { toast } = await loadToast()

    const id = toast.success('Rendered', { title: 'Ok' })
    await nextTick()

    const el = document.querySelector(`.toasts-container--top-right [data-toast-id="${id}"]`)
    expect(el).not.toBeNull()
    expect(el?.classList.contains('base-toast--success')).toBe(true)
    expect(el?.querySelector('.base-toast__title')?.textContent).toBe('Ok')
    expect(el?.querySelector('.base-toast__message')?.textContent?.trim()).toBe('Rendered')
    expect(document.querySelector('.toasts-container')?.classList.contains('vsui')).toBe(true)
  })

  it('groups toasts by position and only renders groups that have toasts', async () => {
    const { toast } = await loadToast()

    toast.info('a', { position: 'top-left' })
    toast.info('b', { position: 'bottom-center' })
    toast.info('c', { position: 'top-left' })
    await nextTick()

    const groups = Array.from(document.querySelectorAll('.toasts-container'))
    expect(groups.map((g) => g.className.replace('vsui toasts-container ', ''))).toEqual([
      'toasts-container--top-left',
      'toasts-container--bottom-center',
    ])
    expect(document.querySelectorAll('.toasts-container--top-left .base-toast')).toHaveLength(2)
    expect(document.querySelectorAll('.toasts-container--bottom-center .base-toast')).toHaveLength(
      1,
    )
    expect(document.querySelector('.toasts-container--top-right')).toBeNull()
  })

  it('passes the toast fields down to BaseToast', async () => {
    const { toast } = await loadToast()

    toast.warning('Careful', {
      position: 'bottom-left',
      simple: true,
      closable: false,
      duration: 0,
    })
    await nextTick()

    const el = document.querySelector('.toasts-container--bottom-left .base-toast')
    expect(el?.classList.contains('base-toast--warning')).toBe(true)
    expect(el?.classList.contains('base-toast--bottom-left')).toBe(true)
    expect(el?.classList.contains('base-toast--simple')).toBe(true)
    expect(el?.querySelector('.base-toast__close')).toBeNull()
  })

  it('removes the toast from the list when its close button is clicked', async () => {
    const { toast } = await loadToast()
    toast.info('Bye')
    await nextTick()

    document.querySelector<HTMLElement>('.base-toast__close')?.click()
    await vi.advanceTimersByTimeAsync(100)

    expect(toast.toasts.value).toHaveLength(0)
  })

  it('removes a simple toast from the list once its duration elapsed', async () => {
    const { toast } = await loadToast()
    toast.info('Auto', { simple: true, duration: 1000 })
    await nextTick()

    await vi.advanceTimersByTimeAsync(1000 + 100)

    expect(toast.toasts.value).toHaveLength(0)
  })

  it('removes a toast from the list when the progress bar animation ends', async () => {
    const { toast } = await loadToast()
    toast.info('Auto')
    await nextTick()

    document.querySelector('.progress-bar')?.dispatchEvent(new Event('animationend'))
    await vi.advanceTimersByTimeAsync(100)

    expect(toast.toasts.value).toHaveLength(0)
  })

  it('does not crash the container when a toast has an unsupported position', async () => {
    const { toast } = await loadToast()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})

    toast.info('Oops', { position: 'top' as ToastPosition })
    await nextTick()

    expect(errors).not.toHaveBeenCalled()
    expect(document.querySelector('[data-toast-id]')).not.toBeNull()
  })

  it('does not crash the container when the default position is unsupported', async () => {
    const { toast, config } = await loadToast()
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    config.setToastDefaults({ position: 'top' as ToastPosition })

    toast.info('Oops')
    await nextTick()

    expect(errors).not.toHaveBeenCalled()
    expect(document.querySelector('[data-toast-id]')).not.toBeNull()
  })
})
