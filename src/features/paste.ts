/**
 * Combine the existing content and newly-pasted text.
 * If the existing content is non-empty and doesn't end with a newline,
 * a single newline is inserted between them.
 */
export function appendWithNewline(existing: string, incoming: string): string {
  if (incoming.length === 0) return existing
  if (existing.length === 0) return incoming
  const separator = existing.endsWith('\n') ? '' : '\n'
  return existing + separator + incoming
}

export type ClipboardReadResult =
  | { kind: 'ok'; text: string }
  | { kind: 'empty' }
  | { kind: 'denied' }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string }

export async function readClipboard(): Promise<ClipboardReadResult> {
  if (!navigator.clipboard?.readText) {
    return { kind: 'unsupported' }
  }
  try {
    const text = await navigator.clipboard.readText()
    if (!text || text.length === 0) return { kind: 'empty' }
    return { kind: 'ok', text }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (/denied|not allowed|permission/i.test(message)) {
      return { kind: 'denied' }
    }
    return { kind: 'error', message }
  }
}
