import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLastFolderId, isShortcutEntry, setLastFolderId } from './shortcut'

const KEY = 'ctop:lastOpenedFolderId'

function resetLS(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

describe('isShortcutEntry', () => {
  it('returns true when from=shortcut is present', () => {
    expect(isShortcutEntry('?from=shortcut')).toBe(true)
    expect(isShortcutEntry('?a=1&from=shortcut&b=2')).toBe(true)
  })

  it('returns false when from=shortcut is absent', () => {
    expect(isShortcutEntry('')).toBe(false)
    expect(isShortcutEntry('?from=other')).toBe(false)
    expect(isShortcutEntry('?foo=bar')).toBe(false)
  })
})

describe('last folder id persistence', () => {
  afterEach(() => {
    resetLS()
  })

  it('round-trips through localStorage', () => {
    resetLS()
    expect(getLastFolderId()).toBeNull()
    setLastFolderId('abc-123')
    expect(getLastFolderId()).toBe('abc-123')
  })

  it('handles localStorage errors gracefully', () => {
    resetLS()
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    expect(() => setLastFolderId('x')).not.toThrow()
    spy.mockRestore()
  })
})
