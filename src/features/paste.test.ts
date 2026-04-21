import { describe, expect, it } from 'vitest'
import { appendWithNewline } from './paste'

describe('appendWithNewline', () => {
  it('returns incoming when existing is empty', () => {
    expect(appendWithNewline('', 'abc')).toBe('abc')
  })

  it('returns existing when incoming is empty', () => {
    expect(appendWithNewline('abc', '')).toBe('abc')
  })

  it('inserts a newline when existing does not end with one', () => {
    expect(appendWithNewline('abc', 'xyz')).toBe('abc\nxyz')
  })

  it('does not insert extra newline when existing already ends with one', () => {
    expect(appendWithNewline('abc\n', 'xyz')).toBe('abc\nxyz')
  })

  it('preserves multiple trailing newlines in existing', () => {
    expect(appendWithNewline('abc\n\n', 'xyz')).toBe('abc\n\nxyz')
  })

  it('preserves newlines within incoming', () => {
    expect(appendWithNewline('abc', 'line1\nline2')).toBe('abc\nline1\nline2')
  })
})
