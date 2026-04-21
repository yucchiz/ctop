export interface PromptOptions {
  title: string
  defaultValue?: string
  placeholder?: string
  okLabel?: string
  cancelLabel?: string
}

export interface ConfirmOptions {
  title: string
  message?: string
  okLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

function buildOverlay(): HTMLDivElement {
  const overlay = document.createElement('div')
  overlay.className = 'dialog-overlay'
  return overlay
}

export function openPrompt(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const overlay = buildOverlay()
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2 class="dialog-title"></h2>
        <input type="text" class="dialog-input" />
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn-cancel"></button>
          <button type="button" class="dialog-btn dialog-btn-ok"></button>
        </div>
      </div>
    `
    const title = overlay.querySelector('.dialog-title') as HTMLElement
    const input = overlay.querySelector('.dialog-input') as HTMLInputElement
    const cancel = overlay.querySelector('.dialog-btn-cancel') as HTMLButtonElement
    const ok = overlay.querySelector('.dialog-btn-ok') as HTMLButtonElement

    title.textContent = options.title
    input.value = options.defaultValue ?? ''
    input.placeholder = options.placeholder ?? ''
    cancel.textContent = options.cancelLabel ?? 'キャンセル'
    ok.textContent = options.okLabel ?? 'OK'

    function close(result: string | null): void {
      overlay.remove()
      resolve(result)
    }

    cancel.addEventListener('click', () => close(null))
    ok.addEventListener('click', () => close(input.value.trim() || null))
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') close(input.value.trim() || null)
      if (e.key === 'Escape') close(null)
    })
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null)
    })

    document.body.appendChild(overlay)
    requestAnimationFrame(() => {
      input.focus()
      input.select()
    })
  })
}

export function openConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = buildOverlay()
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2 class="dialog-title"></h2>
        <p class="dialog-message"></p>
        <div class="dialog-actions">
          <button type="button" class="dialog-btn dialog-btn-cancel"></button>
          <button type="button" class="dialog-btn dialog-btn-ok"></button>
        </div>
      </div>
    `
    const title = overlay.querySelector('.dialog-title') as HTMLElement
    const message = overlay.querySelector('.dialog-message') as HTMLElement
    const cancel = overlay.querySelector('.dialog-btn-cancel') as HTMLButtonElement
    const ok = overlay.querySelector('.dialog-btn-ok') as HTMLButtonElement

    title.textContent = options.title
    if (options.message) {
      message.textContent = options.message
    } else {
      message.remove()
    }
    cancel.textContent = options.cancelLabel ?? 'キャンセル'
    ok.textContent = options.okLabel ?? 'OK'
    if (options.destructive) ok.classList.add('dialog-btn-destructive')

    function close(result: boolean): void {
      overlay.remove()
      resolve(result)
    }

    cancel.addEventListener('click', () => close(false))
    ok.addEventListener('click', () => close(true))
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false)
    })

    document.body.appendChild(overlay)
  })
}
