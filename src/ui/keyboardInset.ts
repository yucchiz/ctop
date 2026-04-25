const CSS_VAR = '--kb-inset'

export interface KeyboardInsetTracker {
  dispose(): void
}

/**
 * Track the on-screen keyboard inset via the VisualViewport API and expose it
 * as a CSS custom property on the document root. iOS Safari's visualViewport
 * height accounts for the QuickType suggestion bar as well, so no extra margin
 * is added here — CSS callers retain a 1rem safe-area buffer for jitter.
 *
 * Returns a no-op tracker when VisualViewport is unavailable.
 */
export function attachKeyboardInsetTracker(): KeyboardInsetTracker {
  const vv = window.visualViewport
  if (!vv) {
    return { dispose: () => {} }
  }

  const root = document.documentElement

  function update(): void {
    const raw = window.innerHeight - vv!.height - vv!.offsetTop
    const inset = Math.max(0, raw)
    root.style.setProperty(CSS_VAR, `${inset}px`)
  }

  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
  update()

  return {
    dispose: () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty(CSS_VAR)
    },
  }
}
