import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import BaseInfiniteScroll from '../../src/components/BaseInfiniteScroll.vue'

type InfiniteScrollProps = InstanceType<typeof BaseInfiniteScroll>['$props']

/** Controllable IntersectionObserver: records instances and lets tests fire the callback. */
class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  readonly root: Element | Document | null
  readonly rootMargin: string
  readonly scrollMargin = ''
  readonly thresholds: readonly number[] = [0]
  readonly observe = vi.fn<(target: Element) => void>()
  readonly unobserve = vi.fn<(target: Element) => void>()
  readonly disconnect = vi.fn<() => void>()

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    this.root = options.root ?? null
    this.rootMargin = options.rootMargin ?? ''
    MockIntersectionObserver.instances.push(this)
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  /** Simulates the browser reporting the sentinel entering or leaving the viewport. */
  report(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this)
  }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  MockIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function mountScroll(
  props: InfiniteScrollProps = {},
  slots: Record<string, string> = {},
): VueWrapper {
  return mount(BaseInfiniteScroll, { props, slots })
}

function observers(): MockIntersectionObserver[] {
  return MockIntersectionObserver.instances
}

function currentObserver(): MockIntersectionObserver {
  return observers()[observers().length - 1]
}

describe('BaseInfiniteScroll', () => {
  describe('observer setup', () => {
    it('creates one observer on mount and observes the trigger element', () => {
      const wrapper = mountScroll()

      expect(observers()).toHaveLength(1)
      expect(observers()[0].observe).toHaveBeenCalledTimes(1)
      expect(observers()[0].observe).toHaveBeenCalledWith(
        wrapper.find('.infinite-scroll__trigger').element,
      )
    })

    it('uses the viewport as root and a 20px bottom margin by default', () => {
      mountScroll()

      expect(observers()[0].options.root).toBeNull()
      expect(observers()[0].options.threshold).toBe(0)
      expect(observers()[0].options.rootMargin).toBe('0px 0px 20px 0px')
    })

    it('applies the threshold prop to the root margin', () => {
      mountScroll({ threshold: 150 })

      expect(observers()[0].options.rootMargin).toBe('0px 0px 150px 0px')
    })

    it('uses the element matching the container selector as root', () => {
      const container = document.createElement('div')
      container.id = 'scroller'
      document.body.appendChild(container)

      try {
        mountScroll({ container: '#scroller' })

        expect(observers()[0].options.root).toBe(container)
      } finally {
        container.remove()
      }
    })

    it('disconnects the observer on unmount', () => {
      const wrapper = mountScroll()

      wrapper.unmount()

      expect(observers()[0].disconnect).toHaveBeenCalledTimes(1)
    })
  })

  describe('load-more', () => {
    it('emits load-more when the observer reports an intersection', () => {
      const wrapper = mountScroll()

      currentObserver().report(true)

      expect(wrapper.emitted('load-more')).toHaveLength(1)
    })

    it('emits load-more every time the sentinel intersects', () => {
      const wrapper = mountScroll()

      currentObserver().report(true)
      currentObserver().report(true)

      expect(wrapper.emitted('load-more')).toHaveLength(2)
    })

    it('does not emit when the sentinel is not intersecting', () => {
      const wrapper = mountScroll()

      currentObserver().report(false)

      expect(wrapper.emitted('load-more')).toBeUndefined()
    })

    it('does not emit while loading', () => {
      const wrapper = mountScroll({ loading: true })

      currentObserver().report(true)

      expect(wrapper.emitted('load-more')).toBeUndefined()
    })

    it('does not emit while disabled', () => {
      const wrapper = mountScroll({ disabled: true })

      currentObserver().report(true)

      expect(wrapper.emitted('load-more')).toBeUndefined()
    })

    it('reads loading and disabled live, without recreating the observer', async () => {
      const wrapper = mountScroll({ loading: true })
      const observer = currentObserver()

      observer.report(true)
      expect(wrapper.emitted('load-more')).toBeUndefined()

      await wrapper.setProps({ loading: false })
      observer.report(true)
      expect(wrapper.emitted('load-more')).toHaveLength(1)

      await wrapper.setProps({ disabled: true })
      observer.report(true)
      expect(wrapper.emitted('load-more')).toHaveLength(1)
    })

    it('re-creates the observer 100ms after loading finishes', async () => {
      vi.useFakeTimers()
      const wrapper = mountScroll({ loading: false })
      const first = currentObserver()

      await wrapper.setProps({ loading: true })
      await wrapper.setProps({ loading: false })
      expect(observers()).toHaveLength(1)

      vi.advanceTimersByTime(99)
      expect(observers()).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(observers()).toHaveLength(2)
      expect(first.disconnect).toHaveBeenCalledTimes(1)
      expect(currentObserver().observe).toHaveBeenCalledWith(
        wrapper.find('.infinite-scroll__trigger').element,
      )
    })

    it('does not re-create the observer when loading starts', async () => {
      vi.useFakeTimers()
      const wrapper = mountScroll()

      await wrapper.setProps({ loading: true })
      vi.advanceTimersByTime(500)

      expect(observers()).toHaveLength(1)
    })

    it('emits load-more again from the re-created observer after loading', async () => {
      vi.useFakeTimers()
      const wrapper = mountScroll({ loading: true })

      await wrapper.setProps({ loading: false })
      vi.advanceTimersByTime(100)
      currentObserver().report(true)

      expect(wrapper.emitted('load-more')).toHaveLength(1)
    })
  })

  describe('slots and text', () => {
    it('renders the default slot content before the trigger', () => {
      const wrapper = mountScroll({}, { default: '<p class="item">Item</p>' })

      expect(wrapper.classes()).toEqual(expect.arrayContaining(['vsui', 'infinite-scroll']))
      expect(wrapper.find('.item').text()).toBe('Item')
      expect(wrapper.find('.infinite-scroll__trigger').exists()).toBe(true)
      expect(wrapper.html().indexOf('item')).toBeLessThan(
        wrapper.html().indexOf('infinite-scroll__trigger'),
      )
    })

    it('renders nothing in the trigger when idle', () => {
      const wrapper = mountScroll()

      expect(wrapper.find('.infinite-scroll__trigger').text()).toBe('')
      expect(wrapper.find('.infinite-scroll__loader').exists()).toBe(false)
      expect(wrapper.find('.infinite-scroll__end').exists()).toBe(false)
    })

    it('renders the default loader with loadingText while loading', () => {
      const wrapper = mountScroll({ loading: true })

      expect(wrapper.find('.infinite-scroll__loader .spinner').exists()).toBe(true)
      expect(wrapper.find('.infinite-scroll__loader').text()).toBe('Loading more items...')
    })

    it('renders a custom loadingText and hides it when empty', () => {
      expect(
        mountScroll({ loading: true, loadingText: 'Fetching' })
          .find('.infinite-scroll__loader')
          .text(),
      ).toBe('Fetching')

      const empty = mountScroll({ loading: true, loadingText: '' })
      expect(empty.find('.infinite-scroll__loader span').exists()).toBe(false)
      expect(empty.find('.infinite-scroll__loader .spinner').exists()).toBe(true)
    })

    it('renders the loading slot instead of the default loader', () => {
      const wrapper = mountScroll({ loading: true }, { loading: '<em class="mine">wait</em>' })

      expect(wrapper.find('.mine').text()).toBe('wait')
      expect(wrapper.find('.infinite-scroll__loader').exists()).toBe(false)
    })

    it('does not render the loading slot when not loading', () => {
      const wrapper = mountScroll({}, { loading: '<em class="mine">wait</em>' })

      expect(wrapper.find('.mine').exists()).toBe(false)
    })

    it('renders the end text when disabled', () => {
      const wrapper = mountScroll({ disabled: true })

      expect(wrapper.find('.infinite-scroll__end').text()).toBe('There are no more items to load')
    })

    it('renders a custom endText and hides it when empty', () => {
      expect(
        mountScroll({ disabled: true, endText: 'The end' }).find('.infinite-scroll__end').text(),
      ).toBe('The end')
      expect(
        mountScroll({ disabled: true, endText: '' }).find('.infinite-scroll__end').exists(),
      ).toBe(false)
    })

    it('renders the disabled slot instead of the end text', () => {
      const wrapper = mountScroll({ disabled: true }, { disabled: '<b class="done">done</b>' })

      expect(wrapper.find('.done').text()).toBe('done')
      expect(wrapper.find('.infinite-scroll__end').exists()).toBe(false)
    })

    it('shows the loader rather than the end text when loading and disabled', () => {
      const wrapper = mountScroll({ loading: true, disabled: true })

      expect(wrapper.find('.infinite-scroll__loader').exists()).toBe(true)
      expect(wrapper.find('.infinite-scroll__end').exists()).toBe(false)
    })
  })

  describe('re-arming the observer', () => {
    it('re-triggers load-more when disabled goes from true to false with the sentinel visible', async () => {
      vi.useFakeTimers()
      const wrapper = mountScroll({ disabled: true })
      currentObserver().report(true)
      expect(wrapper.emitted('load-more')).toBeUndefined()

      await wrapper.setProps({ disabled: false })
      await nextTick()
      vi.advanceTimersByTime(500)

      const rearmed =
        observers().length > 1 ||
        observers().reduce((total, o) => total + o.observe.mock.calls.length, 0) > 1
      expect(rearmed || wrapper.emitted('load-more') !== undefined).toBe(true)
    })

    it('does not create a new observer after unmount', async () => {
      vi.useFakeTimers()
      const wrapper = mountScroll({ loading: true })
      await wrapper.setProps({ loading: false })

      wrapper.unmount()
      vi.advanceTimersByTime(200)

      expect(observers()).toHaveLength(1)
    })
  })
})
