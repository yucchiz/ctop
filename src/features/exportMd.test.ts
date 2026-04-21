import { describe, expect, it } from 'vitest'
import { buildMarkdown, sanitizeFilename } from './exportMd'
import type { Folder } from '../types'

const sample: Folder = {
  id: 'abc',
  name: '読書ノート',
  content: 'hello\nworld',
  createdAt: Date.UTC(2026, 3, 21, 12, 0, 0),
  updatedAt: Date.UTC(2026, 3, 21, 13, 30, 0),
}

describe('sanitizeFilename', () => {
  it('replaces path separators', () => {
    expect(sanitizeFilename('foo/bar')).toBe('foo-bar')
    expect(sanitizeFilename('a\\b:c*d?e"f<g>h|i')).toBe('a-b-c-d-e-f-g-h-i')
  })

  it('trims whitespace', () => {
    expect(sanitizeFilename('  hello  ')).toBe('hello')
  })

  it('returns untitled for empty input', () => {
    expect(sanitizeFilename('')).toBe('untitled')
    expect(sanitizeFilename('   ')).toBe('untitled')
  })

  it('caps long names at 120 chars', () => {
    const long = 'a'.repeat(200)
    expect(sanitizeFilename(long).length).toBe(120)
  })

  it('preserves Japanese characters', () => {
    expect(sanitizeFilename('読書ノート')).toBe('読書ノート')
  })
})

describe('buildMarkdown', () => {
  it('emits frontmatter with title, createdAt, updatedAt then content', () => {
    const md = buildMarkdown(sample)
    expect(md).toMatch(/^---\n/)
    expect(md).toContain('title: 読書ノート')
    expect(md).toContain(`createdAt: ${new Date(sample.createdAt).toISOString()}`)
    expect(md).toContain(`updatedAt: ${new Date(sample.updatedAt).toISOString()}`)
    expect(md).toMatch(/---\n\nhello\nworld$/)
  })

  it('handles empty content', () => {
    const md = buildMarkdown({ ...sample, content: '' })
    expect(md.endsWith('---\n\n')).toBe(true)
  })
})
