export interface Folder {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
}

export type FolderPatch = Partial<Pick<Folder, 'name' | 'content'>>
