export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export interface Autosaver {
  schedule(content: string): void
  flush(): Promise<void>
  status(): AutosaveStatus
}

export interface AutosaveOptions {
  delay?: number
  onStatusChange?: (status: AutosaveStatus) => void
}

export function createAutosaver(
  save: (content: string) => Promise<void>,
  options: AutosaveOptions = {},
): Autosaver {
  const delay = options.delay ?? 500
  let timer: ReturnType<typeof setTimeout> | null = null
  let latest: string | null = null
  let status: AutosaveStatus = 'idle'
  let inflight: Promise<void> | null = null

  function setStatus(next: AutosaveStatus): void {
    if (status === next) return
    status = next
    options.onStatusChange?.(next)
  }

  async function persist(): Promise<void> {
    if (latest === null) return
    const value = latest
    latest = null
    setStatus('saving')
    try {
      await save(value)
      setStatus('saved')
    } catch (err) {
      setStatus('error')
      throw err
    }
  }

  function schedule(content: string): void {
    latest = content
    setStatus('pending')
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      inflight = persist().catch((err) => {
        console.error('autosave failed', err)
      })
    }, delay)
  }

  async function flush(): Promise<void> {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
      inflight = persist()
    }
    if (inflight) await inflight
  }

  return {
    schedule,
    flush,
    status: () => status,
  }
}
