const CSS_VAR = '--kb-inset'
const EXTRA_VAR = '--kb-extra'
const EXTRA_WHEN_VISIBLE = '0.75rem'
const EXTRA_WHEN_HIDDEN = '0px'

export interface KeyboardInsetTracker {
  dispose(): void
}

/**
 * Track the on-screen keyboard inset via the VisualViewport API and expose it
 * as a CSS custom property on the document root. iOS Safari's visualViewport
 * height does not include the form input accessory bar (Done button), so an
 * extra margin is applied via --kb-extra while the keyboard is visible.
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
    root.style.setProperty(EXTRA_VAR, inset > 0 ? EXTRA_WHEN_VISIBLE : EXTRA_WHEN_HIDDEN)
  }

  vv.addEventListener('resize', update)
  vv.addEventListener('scroll', update)
  update()

  return {
    dispose: () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      root.style.removeProperty(CSS_VAR)
      root.style.removeProperty(EXTRA_VAR)
    },
  }
}
