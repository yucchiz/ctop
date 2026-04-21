import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import {
  _resetDBForTests,
  createFolder,
  deleteFolder,
  getFolder,
  listFolders,
  updateFolder,
} from './storage'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  _resetDBForTests()
})

describe('storage', () => {
  it('creates and retrieves a folder', async () => {
    const folder = await createFolder('テスト')
    expect(folder.name).toBe('テスト')
    expect(folder.content).toBe('')
    expect(folder.id).toBeTruthy()

    const fetched = await getFolder(folder.id)
    expect(fetched).toEqual(folder)
  })

  it('lists folders in updatedAt descending order', async () => {
    const a = await createFolder('A')
    await new Promise((r) => setTimeout(r, 2))
    await createFolder('B')
    await new Promise((r) => setTimeout(r, 2))
    await updateFolder(a.id, { content: 'touched' })

    const list = await listFolders()
    expect(list.map((f) => f.name)).toEqual(['A', 'B'])
  })

  it('updates folder content and updatedAt', async () => {
    const folder = await createFolder('更新テスト')
    await new Promise((r) => setTimeout(r, 2))
    const updated = await updateFolder(folder.id, { content: 'hello' })
    expect(updated.content).toBe('hello')
    expect(updated.updatedAt).toBeGreaterThan(folder.updatedAt)
    expect(updated.createdAt).toBe(folder.createdAt)
  })

  it('throws when updating a missing folder', async () => {
    await expect(updateFolder('nonexistent-id', { content: 'x' })).rejects.toThrow(
      /Folder not found/,
    )
  })

  it('deletes a folder', async () => {
    const folder = await createFolder('削除')
    await deleteFolder(folder.id)
    const fetched = await getFolder(folder.id)
    expect(fetched).toBeUndefined()
  })

  it('returns empty array when no folders exist', async () => {
    const list = await listFolders()
    expect(list).toEqual([])
  })
})
