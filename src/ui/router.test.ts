import { describe, expect, it } from 'vitest'
import { parseHash } from './router'

describe('parseHash', () => {
  it('returns list for empty or /', () => {
    expect(parseHash('')).toEqual({ name: 'list' })
    expect(parseHash('#/')).toEqual({ name: 'list' })
    expect(parseHash('#/?something=1')).toEqual({ name: 'list' })
  })

  it('parses editor route', () => {
    expect(parseHash('#/folders/abc-123')).toEqual({ name: 'editor', id: 'abc-123' })
  })

  it('decodes URI-encoded IDs', () => {
    expect(parseHash('#/folders/abc%2F123')).toEqual({ name: 'editor', id: 'abc/123' })
  })

  it('falls back to list for unknown routes', () => {
    expect(parseHash('#/unknown')).toEqual({ name: 'list' })
  })
})
