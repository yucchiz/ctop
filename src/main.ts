import './styles.css'
import { createFolder, getFolder, listFolders, requestPersistence } from './db/storage'
import {
  cleanEntryParams,
  getLastFolderId,
  isShortcutEntry,
  setLastFolderId,
} from './features/shortcut'
import { openConfirm } from './ui/dialog'
import { renderEditor, type EditorHandle } from './ui/editor'
import { renderFolderList } from './ui/folderList'
import { navigate, onRouteChange, parseHash, type Route } from './ui/router'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

let activeEditor: EditorHandle | null = null

async function handleRoute(route: Route): Promise<void> {
  if (activeEditor) {
    activeEditor.dispose()
    activeEditor = null
  }
  if (route.name === 'list') {
    await renderFolderList(app!)
  } else {
    activeEditor = await renderEditor(app!, route.id)
    setLastFolderId(route.id)
  }
}

async function resolveShortcutTarget(): Promise<string | null> {
  const lastId = getLastFolderId()
  if (lastId) {
    const folder = await getFolder(lastId)
    if (folder) return folder.id
  }
  const folders = await listFolders()
  if (folders.length > 0) return folders[0]!.id
  const fresh = await createFolder('メモ')
  return fresh.id
}

async function runShortcutFlow(): Promise<void> {
  cleanEntryParams()
  const targetId = await resolveShortcutTarget()
  if (!targetId) return

  const current = parseHash(location.hash)
  if (current.name !== 'editor' || current.id !== targetId) {
    navigate({ name: 'editor', id: targetId })
    await new Promise((r) => setTimeout(r, 0))
    await handleRoute({ name: 'editor', id: targetId })
  }

  const ok = await openConfirm({
    title: 'クリップボードを追記しますか？',
    message: 'ショートカット経由で受け取ったテキストをこのフォルダの末尾に追加します。',
    okLabel: '追記',
  })
  if (!ok) return
  await activeEditor?.pasteFromClipboard()
}

async function boot(): Promise<void> {
  void requestPersistence()

  const folders = await listFolders()
  if (folders.length === 0) {
    await createFolder('メモ')
  }

  const cameFromShortcut = isShortcutEntry(location.search)

  await handleRoute(parseHash(location.hash))
  onRouteChange((route) => {
    void handleRoute(route)
  })

  if (cameFromShortcut) {
    void runShortcutFlow()
  }
}

void boot()
