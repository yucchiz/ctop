import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { attachKeyboardInsetTracker } from './keyboardInset'

const ORIGINAL_VV = Object.getOwnPropertyDescriptor(window, 'visualViewport')
const ORIGINAL_INNER_HEIGHT = window.innerHeight

interface MockVisualViewport {
  height: number
  offsetTop: number
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
}

function getHandler(vv: MockVisualViewport, type: 'resize' | 'scroll'): () => void {
  const call = vv.addEventListener.mock.calls.find((c) => c[0] === type)
  if (!call) throw new Error(`no ${type} listener registered`)
  return call[1] as () => void
}

function installVisualViewport(initial: {
  height: number
  offsetTop?: number
}): MockVisualViewport {
  const vv: MockVisualViewport = {
    height: initial.height,
    offsetTop: initial.offsetTop ?? 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: vv })
  return vv
}

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
})

afterEach(() => {
  document.documentElement.style.removeProperty('--kb-inset')
  if (ORIGINAL_VV) {
    Object.defineProperty(window, 'visualViewport', ORIGINAL_VV)
  } else {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined })
  }
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: ORIGINAL_INNER_HEIGHT,
  })
})

describe('attachKeyboardInsetTracker', () => {
  it('initialises --kb-inset to 0px when keyboard is hidden', () => {
    installVisualViewport({ height: 800 })
    const tracker = attachKeyboardInsetTracker()
    expect(document.documentElement.style.getPropertyValue('--kb-inset')).toBe('0px')
    tracker.dispose()
  })

  it('registers resize and scroll listeners on the visualViewport', () => {
    const vv = installVisualViewport({ height: 800 })
    const tracker = attachKeyboardInsetTracker()
    expect(vv.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(vv.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    tracker.dispose()
  })

  it('reflects the keyboard height into --kb-inset on resize', () => {
    const vv = installVisualViewport({ height: 800 })
    const tracker = attachKeyboardInsetTracker()
    vv.height = 500
    getHandler(vv, 'resize')()
    expect(document.documentElement.style.getPropertyValue('--kb-inset')).toBe('300px')
    tracker.dispose()
  })

  it('subtracts visualViewport.offsetTop from the inset', () => {
    installVisualViewport({ height: 700, offsetTop: 50 })
    const tracker = attachKeyboardInsetTracker()
    expect(document.documentElement.style.getPropertyValue('--kb-inset')).toBe('50px')
    tracker.dispose()
  })

  it('clamps negative insets to 0px', () => {
    installVisualViewport({ height: 900 })
    const tracker = attachKeyboardInsetTracker()
    expect(document.documentElement.style.getPropertyValue('--kb-inset')).toBe('0px')
    tracker.dispose()
  })

  it('removes both listeners and clears --kb-inset on dispose', () => {
    const vv = installVisualViewport({ height: 500 })
    const tracker = attachKeyboardInsetTracker()
    expect(document.documentElement.style.getPropertyValue('--kb-inset')).toBe('300px')

    const resizeHandler = getHandler(vv, 'resize')
    const scrollHandler = getHandler(vv, 'scroll')

    tracker.dispose()
    expect(vv.removeEventListener).toHaveBeenCalledWith('resize', resizeHandler)
    expect(vv.removeEventListener).toHaveBeenCalledWith('scroll', scrollHandler)
    expect(document.documentElement.style.getPropertyValue('--kb-inset')).toBe('')
  })

  it('returns a no-op tracker when visualViewport is undefined', () => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined })
    const tracker = attachKeyboardInsetTracker()
    expect(document.documentElement.style.getPropertyValue('--kb-inset')).toBe('')
    expect(() => tracker.dispose()).not.toThrow()
  })
})
