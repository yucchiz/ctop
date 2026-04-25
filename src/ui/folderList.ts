import { createFolder, deleteFolder, listFolders, updateFolder } from '../db/storage'
import type { Folder } from '../types'
import { openConfirm, openPrompt } from './dialog'
import { navigate } from './router'
import { showToast } from './toast'
import { renderVersionBadge } from './versionBadge'

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'たった今'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}時間前`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day}日前`
  const d = new Date(ts)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function formatSize(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export async function renderFolderList(root: HTMLElement): Promise<void> {
  const folders = await listFolders()

  root.innerHTML = `
    <header class="app-header">
      <h1>CtoP</h1>
      <button type="button" class="btn-primary" id="btn-new-folder">＋ 新規</button>
      ${renderVersionBadge()}
    </header>
    <main class="app-main folder-list-main">
      ${
        folders.length === 0
          ? '<p class="empty">フォルダがありません。「＋ 新規」で作成してください。</p>'
          : `<ul class="folder-list">
              ${folders.map(renderItem).join('')}
            </ul>`
      }
    </main>
  `

  root.querySelector<HTMLButtonElement>('#btn-new-folder')?.addEventListener('click', async () => {
    const name = await openPrompt({
      title: '新しいフォルダ',
      placeholder: 'フォルダ名',
      okLabel: '作成',
    })
    if (!name) return
    const folder = await createFolder(name)
    navigate({ name: 'editor', id: folder.id })
  })

  root.querySelectorAll<HTMLElement>('.folder-item').forEach((el) => {
    const id = el.dataset.id!
    el.querySelector('.folder-tap')?.addEventListener('click', () => {
      navigate({ name: 'editor', id })
    })
    el.querySelector('.folder-menu')?.addEventListener('click', async (e) => {
      e.stopPropagation()
      await openFolderMenu(id, root)
    })
  })
}

function renderItem(f: Folder): string {
  const bytes = new Blob([f.content]).size
  return `
    <li class="folder-item" data-id="${f.id}">
      <button type="button" class="folder-tap">
        <span class="folder-name">${escapeHtml(f.name)}</span>
        <span class="folder-meta">${formatSize(bytes)} ・ ${formatRelative(f.updatedAt)}</span>
      </button>
      <button type="button" class="folder-menu" aria-label="メニュー">⋯</button>
    </li>
  `
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function openFolderMenu(id: string, root: HTMLElement): Promise<void> {
  const overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.innerHTML = `
    <div class="sheet" role="menu">
      <button type="button" class="sheet-item" data-action="rename">名前を変更</button>
      <button type="button" class="sheet-item sheet-item-destructive" data-action="delete">削除</button>
      <button type="button" class="sheet-item sheet-item-cancel" data-action="cancel">キャンセル</button>
    </div>
  `

  function close(): void {
    overlay.remove()
  }

  overlay.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement
    const action = target.dataset.action
    if (!action) {
      if (e.target === overlay) close()
      return
    }
    close()
    if (action === 'rename') {
      const { getFolder } = await import('../db/storage')
      const folder = await getFolder(id)
      if (!folder) return
      const name = await openPrompt({
        title: '名前を変更',
        defaultValue: folder.name,
        okLabel: '変更',
      })
      if (!name) return
      await updateFolder(id, { name })
      showToast('名前を変更しました')
      await renderFolderList(root)
    } else if (action === 'delete') {
      const ok = await openConfirm({
        title: 'フォルダを削除しますか？',
        message: 'この操作は取り消せません。',
        okLabel: '削除',
        destructive: true,
      })
      if (!ok) return
      await deleteFolder(id)
      showToast('削除しました')
      await renderFolderList(root)
    }
  })

  document.body.appendChild(overlay)
}
