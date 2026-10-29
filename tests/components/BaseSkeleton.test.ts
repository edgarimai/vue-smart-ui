import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import BaseSkeleton from '../../src/components/BaseSkeleton.vue'

type SkeletonProps = InstanceType<typeof BaseSkeleton>['$props']

enableAutoUnmount(afterEach)

function mountSkeleton(props: SkeletonProps = {}, slots: Record<string, string> = {}): VueWrapper {
  return mount(BaseSkeleton, { props, slots })
}

function style(wrapper: VueWrapper): CSSStyleDeclaration {
  return (wrapper.element as HTMLElement).style
}

describe('BaseSkeleton', () => {
  it('renders a div with the base, rectangle and animated classes by default', () => {
    const wrapper = mountSkeleton()

    expect(wrapper.element.tagName).toBe('DIV')
    expect(wrapper.classes()).toEqual(
      expect.arrayContaining([
        'vsui',
        'base-skeleton',
        'base-skeleton--rectangle',
        'base-skeleton--animated',
      ]),
    )
    expect(wrapper.classes()).not.toContain('base-skeleton--rounded')
  })

  it.each(['rectangle', 'circle', 'text', 'heading', 'button'] as const)(
    'applies the %s variant class',
    (variant) => {
      expect(mountSkeleton({ variant }).classes()).toContain(`base-skeleton--${variant}`)
    },
  )

  it('removes the animated class with animated=false', () => {
    expect(mountSkeleton({ animated: false }).classes()).not.toContain('base-skeleton--animated')
  })

  it('adds the rounded class with rounded=true', () => {
    expect(mountSkeleton({ rounded: true }).classes()).toContain('base-skeleton--rounded')
  })

  it('applies width and height as inline styles', () => {
    const wrapper = mountSkeleton({ width: '120px', height: '2rem' })

    expect(style(wrapper).width).toBe('120px')
    expect(style(wrapper).height).toBe('2rem')
  })

  it('defaults to a 100% inline width and no inline height', () => {
    const wrapper = mountSkeleton()

    expect(style(wrapper).width).toBe('100%')
    expect(style(wrapper).height).toBe('')
  })

  it('does not set an inline height when height is null', () => {
    expect(style(mountSkeleton({ height: null })).height).toBe('')
  })

  it('renders the default slot', () => {
    const wrapper = mountSkeleton({}, { default: '<span class="inner">loading</span>' })

    expect(wrapper.find('.inner').text()).toBe('loading')
  })

  it('reacts to prop changes', async () => {
    const wrapper = mountSkeleton({ variant: 'text', width: '50%' })

    await wrapper.setProps({ variant: 'heading', width: '75%', rounded: true })

    expect(wrapper.classes()).toContain('base-skeleton--heading')
    expect(wrapper.classes()).not.toContain('base-skeleton--text')
    expect(wrapper.classes()).toContain('base-skeleton--rounded')
    expect(style(wrapper).width).toBe('75%')
  })

  describe('known defects', () => {
    // BUG: the default inline width of 100% overrides the circle variant's own size
    it.fails('does not force an inline width on the circle variant by default', () => {
      expect(style(mountSkeleton({ variant: 'circle' })).width).toBe('')
    })
  })
})
