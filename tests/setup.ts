// jsdom does not implement these browser APIs. Minimal stand-ins keep components
// that observe the DOM from throwing on mount; tests that need to trigger the
// callbacks can replace them with their own mocks via vi.stubGlobal.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: readonly number[] = []
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = ResizeObserverStub
}

if (!('IntersectionObserver' in globalThis)) {
  globalThis.IntersectionObserver = IntersectionObserverStub
}
