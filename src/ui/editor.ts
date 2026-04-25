import { getFolder, updateFolder } from '../db/storage'
import { createAutosaver, type AutosaveStatus } from '../features/autosave'
import { exportFolder } from '../features/exportMd'
import { appendWithNewline, readClipboard } from '../features/paste'
import { openPrompt } from './dialog'
import { attachKeyboardInsetTracker } from './keyboardInset'
import { navigate } from './router'
import { showToast } from './toast'
import { renderVersionBadge } from './versionBadge'

export interface EditorHandle {
  dispose(): void
}

export async function renderEditor(root: HTMLElement, folderId: string): Promise<EditorHandle> {
  const folder = await getFolder(folderId)
  if (!folder) {
    showToast('フォルダが見つかりません', 'error')
    navigate({ name: 'list' })
    return { dispose: () => {} }
  }

  root.innerHTML = `
    <header class="app-header editor-header">
      <button type="button" class="btn-ghost" id="btn-back" aria-label="戻る">‹ 戻る</button>
      <button type="button" class="folder-title" id="folder-title"></button>
      <span class="save-indicator" id="save-indicator" aria-live="polite"></span>
      <button type="button" class="btn-menu" id="btn-export" aria-label="エクスポート">⬇</button>
      ${renderVersionBadge()}
    </header>
    <main class="app-main editor-main">
      <textarea id="editor" spellcheck="false" placeholder="ここにテキストを入力・ペーストしてください…"></textarea>
      <button type="button" class="fab-paste" id="btn-paste" aria-label="クリップボードから追記">
        <span aria-hidden="true">📋</span>
      </button>
    </main>
  `

  const titleBtn = root.querySelector<HTMLButtonElement>('#folder-title')!
  const textarea = root.querySelector<HTMLTextAreaElement>('#editor')!
  const backBtn = root.querySelector<HTMLButtonElement>('#btn-back')!
  const indicator = root.querySelector<HTMLElement>('#save-indicator')!
  const pasteBtn = root.querySelector<HTMLButtonElement>('#btn-paste')!
  const exportBtn = root.querySelector<HTMLButtonElement>('#btn-export')!

  titleBtn.textContent = folder.name
  textarea.value = folder.content

  const autosaver = createAutosaver(
    async (content) => {
      await updateFolder(folderId, { content })
    },
    {
      delay: 500,
      onStatusChange: (s) => updateIndicator(indicator, s),
    },
  )

  const onInput = (): void => autosaver.schedule(textarea.value)
  textarea.addEventListener('input', onInput)

  backBtn.addEventListener('click', async () => {
    await autosaver.flush()
    navigate({ name: 'list' })
  })

  pasteBtn.addEventListener('click', async () => {
    const result = await readClipboard()
    switch (result.kind) {
      case 'ok': {
        const combined = appendWithNewline(textarea.value, result.text)
        textarea.value = combined
        autosaver.schedule(combined)
        showToast(`${result.text.length}文字を追記しました`)
        break
      }
      case 'empty':
        showToast('クリップボードが空です')
        break
      case 'denied':
        showToast(
          'クリップボード読み取りが拒否されました。長押しペーストをご利用ください',
          'error',
          4000,
        )
        break
      case 'unsupported':
        showToast(
          'このブラウザはクリップボード読取に対応していません。長押しペーストをご利用ください',
          'error',
          4000,
        )
        break
      case 'error':
        showToast(`読み取りに失敗しました: ${result.message}`, 'error', 4000)
        break
    }
  })

  titleBtn.addEventListener('click', async () => {
    const name = await openPrompt({
      title: '名前を変更',
      defaultValue: folder.name,
      okLabel: '変更',
    })
    if (!name) return
    await updateFolder(folderId, { name })
    folder.name = name
    titleBtn.textContent = name
  })

  exportBtn.addEventListener('click', async () => {
    await autosaver.flush()
    const latest = await getFolder(folderId)
    if (!latest) return
    try {
      const result = await exportFolder(latest)
      if (!result.shared) showToast('Markdown をダウンロードしました')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast(`エクスポート失敗: ${msg}`, 'error', 4000)
    }
  })

  const onBeforeUnload = (): void => {
    void autosaver.flush()
  }
  window.addEventListener('beforeunload', onBeforeUnload)

  const keyboardTracker = attachKeyboardInsetTracker()

  return {
    dispose: () => {
      textarea.removeEventListener('input', onInput)
      window.removeEventListener('beforeunload', onBeforeUnload)
      keyboardTracker.dispose()
      void autosaver.flush()
    },
  }
}

function updateIndicator(el: HTMLElement, status: AutosaveStatus): void {
  el.className = `save-indicator save-${status}`
  switch (status) {
    case 'idle':
      el.textContent = ''
      break
    case 'pending':
      el.textContent = '…'
      break
    case 'saving':
      el.textContent = '保存中'
      break
    case 'saved':
      el.textContent = '✓'
      break
    case 'error':
      el.textContent = '失敗'
      break
  }
}
