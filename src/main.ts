import './styles.css'
import { createFolder, listFolders, requestPersistence } from './db/storage'
import { renderEditor, type EditorHandle } from './ui/editor'
import { renderFolderList } from './ui/folderList'
import { onRouteChange, parseHash, type Route } from './ui/router'

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
  }
}

async function boot(): Promise<void> {
  void requestPersistence()

  const folders = await listFolders()
  if (folders.length === 0) {
    await createFolder('メモ')
  }

  await handleRoute(parseHash(location.hash))
  onRouteChange((route) => {
    void handleRoute(route)
  })
}

void boot()
