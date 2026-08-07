import { ref, type CSSProperties, type Ref } from 'vue'

export type FloatingMenuAlign = 'start' | 'end'

export interface UseFloatingMenuOptions {
  anchorRef: Ref<HTMLElement | null>
  menuRef: Ref<HTMLElement | null>
  align?: FloatingMenuAlign
  offset?: number
  matchAnchorWidth?: boolean
  minWidth?: number | (() => number)
  maxHeight?: number | string | (() => number | string | undefined)
  enabled?: () => boolean
}

export interface UseFloatingMenuReturn {
  floatingStyle: Ref<CSSProperties>
  updatePosition: () => void
  startTracking: () => void
  stopTracking: () => void
}

const THROTTLE_MS = 16 // ~60fps

const parseMaxHeight = (maxHeight?: number | string): number | null => {
  if (maxHeight == null) return null
  if (typeof maxHeight === 'number') return maxHeight
  const parsed = parseFloat(maxHeight)
  return Number.isNaN(parsed) ? null : parsed
}

export function useFloatingMenu(options: UseFloatingMenuOptions): UseFloatingMenuReturn {
  const {
    anchorRef,
    menuRef,
    align = 'start',
    offset = 4,
    matchAnchorWidth = false,
    minWidth = 0,
    maxHeight,
    enabled,
  } = options

  const resolveMinWidth = (): number => (typeof minWidth === 'function' ? minWidth() : minWidth)
  const resolveMaxHeight = (): number | string | undefined =>
    typeof maxHeight === 'function' ? maxHeight() : maxHeight

  const floatingStyle = ref<CSSProperties>({})

  let throttleTimeout: ReturnType<typeof setTimeout> | null = null

  const updatePosition = () => {
    if (enabled && !enabled()) {
      floatingStyle.value = {}
      return
    }

    const anchor = anchorRef.value
    const menu = menuRef.value
    if (!anchor || !menu) return

    const anchorRect = anchor.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const style: CSSProperties = { position: 'fixed' }
    const resolvedMinWidth = resolveMinWidth()

    let width: number | undefined
    if (matchAnchorWidth) {
      width = Math.max(anchorRect.width, resolvedMinWidth)
      style.width = `${width}px`
    } else if (resolvedMinWidth) {
      style.minWidth = `${resolvedMinWidth}px`
    }

    const menuWidth = width ?? menu.offsetWidth

    let left: number
    if (align === 'end') {
      left = anchorRect.right - menuWidth
      if (left < 0) left = anchorRect.left
      if (left + menuWidth > viewportWidth) left = Math.max(viewportWidth - menuWidth, 0)
    } else {
      left = anchorRect.left
      if (left + menuWidth > viewportWidth) left = Math.max(anchorRect.right - menuWidth, 0)
    }
    style.left = `${left}px`

    const menuHeight = menu.offsetHeight
    const spaceBelow = viewportHeight - anchorRect.bottom - offset
    const spaceAbove = anchorRect.top - offset
    const configuredMaxHeight = parseMaxHeight(resolveMaxHeight())

    const fitsBelow = menuHeight <= spaceBelow
    const placeAbove = !fitsBelow && spaceAbove > spaceBelow

    if (placeAbove) {
      const effectiveMaxHeight = Math.max(
        0,
        configuredMaxHeight != null ? Math.min(configuredMaxHeight, spaceAbove) : spaceAbove,
      )
      style.maxHeight = `${effectiveMaxHeight}px`
      style.top = `${anchorRect.top - offset - Math.min(menuHeight, effectiveMaxHeight)}px`
    } else {
      const effectiveMaxHeight = Math.max(
        0,
        configuredMaxHeight != null ? Math.min(configuredMaxHeight, spaceBelow) : spaceBelow,
      )
      style.maxHeight = `${effectiveMaxHeight}px`
      style.top = `${anchorRect.bottom + offset}px`
    }

    floatingStyle.value = style
  }

  const throttledUpdatePosition = () => {
    if (throttleTimeout) return
    throttleTimeout = setTimeout(() => {
      updatePosition()
      throttleTimeout = null
    }, THROTTLE_MS)
  }

  const startTracking = () => {
    window.addEventListener('scroll', throttledUpdatePosition, true)
    window.addEventListener('resize', throttledUpdatePosition)
  }

  const stopTracking = () => {
    window.removeEventListener('scroll', throttledUpdatePosition, true)
    window.removeEventListener('resize', throttledUpdatePosition)
    if (throttleTimeout) {
      clearTimeout(throttleTimeout)
      throttleTimeout = null
    }
  }

  return {
    floatingStyle,
    updatePosition,
    startTracking,
    stopTracking,
  }
}
