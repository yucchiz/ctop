import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Folder, FolderPatch } from '../types'

interface CtoPSchema extends DBSchema {
  folders: {
    key: string
    value: Folder
    indexes: { 'by-updatedAt': number }
  }
}

const DB_NAME = 'ctop-db'
const DB_VERSION = 1
const STORE = 'folders'

let dbPromise: Promise<IDBPDatabase<CtoPSchema>> | null = null

function getDB(): Promise<IDBPDatabase<CtoPSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<CtoPSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('by-updatedAt', 'updatedAt')
      },
    })
  }
  return dbPromise
}

export function _resetDBForTests(): void {
  dbPromise = null
}

function newId(): string {
  return crypto.randomUUID()
}

export async function createFolder(name: string): Promise<Folder> {
  const now = Date.now()
  const folder: Folder = {
    id: newId(),
    name,
    content: '',
    createdAt: now,
    updatedAt: now,
  }
  const db = await getDB()
  await db.put(STORE, folder)
  return folder
}

export async function getFolder(id: string): Promise<Folder | undefined> {
  const db = await getDB()
  return db.get(STORE, id)
}

export async function listFolders(): Promise<Folder[]> {
  const db = await getDB()
  const all = await db.getAllFromIndex(STORE, 'by-updatedAt')
  return all.reverse()
}

export async function updateFolder(id: string, patch: FolderPatch): Promise<Folder> {
  const db = await getDB()
  const tx = db.transaction(STORE, 'readwrite')
  const existing = await tx.store.get(id)
  if (!existing) {
    await tx.done
    throw new Error(`Folder not found: ${id}`)
  }
  const updated: Folder = {
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  }
  await tx.store.put(updated)
  await tx.done
  return updated
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, id)
}

export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
