type ToastKind = 'info' | 'error'

let container: HTMLDivElement | null = null

function ensureContainer(): HTMLDivElement {
  if (container) return container
  const el = document.createElement('div')
  el.className = 'toast-container'
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  document.body.appendChild(el)
  container = el
  return el
}

export function showToast(message: string, kind: ToastKind = 'info', durationMs = 2500): void {
  const root = ensureContainer()
  const item = document.createElement('div')
  item.className = `toast toast-${kind}`
  item.textContent = message
  root.appendChild(item)
  requestAnimationFrame(() => item.classList.add('toast-show'))
  setTimeout(() => {
    item.classList.remove('toast-show')
    item.addEventListener('transitionend', () => item.remove(), { once: true })
    setTimeout(() => item.remove(), 500)
  }, durationMs)
}
