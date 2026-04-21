const LAST_FOLDER_KEY = 'ctop:lastOpenedFolderId'

export function isShortcutEntry(search: string): boolean {
  const params = new URLSearchParams(search)
  return params.get('from') === 'shortcut'
}

export function cleanEntryParams(): void {
  const url = new URL(location.href)
  if (url.search.length === 0) return
  url.search = ''
  history.replaceState(null, '', url.pathname + url.hash)
}

export function getLastFolderId(): string | null {
  try {
    return localStorage.getItem(LAST_FOLDER_KEY)
  } catch {
    return null
  }
}

export function setLastFolderId(id: string): void {
  try {
    localStorage.setItem(LAST_FOLDER_KEY, id)
  } catch {
    /* ignore storage errors */
  }
}
