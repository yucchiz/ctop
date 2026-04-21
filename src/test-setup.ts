const store = new Map<string, string>()

const memoryStorage: Storage = {
  get length(): number {
    return store.size
  },
  clear(): void {
    store.clear()
  },
  getItem(key: string): string | null {
    return store.get(key) ?? null
  },
  key(index: number): string | null {
    return Array.from(store.keys())[index] ?? null
  },
  removeItem(key: string): void {
    store.delete(key)
  },
  setItem(key: string, value: string): void {
    store.set(key, String(value))
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage,
  writable: true,
  configurable: true,
})
