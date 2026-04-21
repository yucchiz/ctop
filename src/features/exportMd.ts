import type { Folder } from '../types'

/**
 * Sanitize a folder name into a filesystem-safe filename (without extension).
 * Replaces path separators and other unsafe characters with `-`.
 */
export function sanitizeFilename(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'untitled'
  return trimmed.replace(/[\\/:*?"<>|\x00-\x1f]/g, '-').slice(0, 120)
}

function toIso(ts: number): string {
  return new Date(ts).toISOString()
}

export function buildMarkdown(folder: Folder): string {
  const lines = [
    '---',
    `title: ${folder.name}`,
    `createdAt: ${toIso(folder.createdAt)}`,
    `updatedAt: ${toIso(folder.updatedAt)}`,
    '---',
    '',
    folder.content,
  ]
  return lines.join('\n')
}

export interface ExportResult {
  shared: boolean
}

export async function exportFolder(folder: Folder): Promise<ExportResult> {
  const filename = `${sanitizeFilename(folder.name)}.md`
  const text = buildMarkdown(folder)
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })

  const file = new File([blob], filename, { type: 'text/markdown;charset=utf-8' })
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: folder.name })
      return { shared: true }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { shared: false }
      }
      // fall through to download
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { shared: false }
}
