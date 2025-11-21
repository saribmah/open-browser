import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  getFileList,
  getFileTree,
  getFileRead,
} from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
import type {
  GetFileListResponses,
  GetFileTreeResponses,
  GetFileReadResponses,
} from "@/client/sandbox/types.gen"

export type FileType = "file" | "directory"

export interface FileItem {
  name: string
  path: string
  type: FileType
  size?: number
  modifiedAt?: string
}

export interface FileTreeNode {
  name: string
  path: string
  type: FileType
  children?: FileTreeNode[]
}

export interface FileContent {
  path: string
  content: string
}

export interface FilesystemState {
  files: FileItem[]
  tree: FileTreeNode | null
  currentFile: FileContent | null
  isLoadingFiles: boolean
  isLoadingTree: boolean
  isLoadingContent: boolean
  error: string | null
}

export interface FilesystemActions {
  getFileList: (path: string, sandboxClient: typeof sandboxClientType) => Promise<void>
  getFileTree: (path: string, maxDepth: number, sandboxClient: typeof sandboxClientType) => Promise<void>
  readFile: (path: string, sandboxClient: typeof sandboxClientType) => Promise<void>
  clearCurrentFile: () => void
  setError: (error: string | null) => void
  reset: () => void
}

export type FilesystemStoreState = FilesystemState & FilesystemActions

export const createFilesystemStore = () => {
  const initialState: FilesystemState = {
    files: [],
    tree: null,
    currentFile: null,
    isLoadingFiles: false,
    isLoadingTree: false,
    isLoadingContent: false,
    error: null,
  }

  return create<FilesystemStoreState>()(
    devtools(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        getFileList: async (path: string, sandboxClient: typeof sandboxClientType) => {
          set({ isLoadingFiles: true, error: null })

          try {
            const result = await getFileList({
              query: { path },
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to get file list"
              set({ error: errorMsg, isLoadingFiles: false })
              return
            }

            const data = result.data as GetFileListResponses[200]
            if (data) {
              set({
                files: data.files,
                isLoadingFiles: false,
              })
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to get file list",
              isLoadingFiles: false,
            })
          }
        },

        getFileTree: async (path: string, maxDepth: number, sandboxClient: typeof sandboxClientType) => {
          set({ isLoadingTree: true, error: null })

          try {
            const result = await getFileTree({
              query: { path, maxDepth: maxDepth.toString() },
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to get file tree"
              set({ error: errorMsg, isLoadingTree: false })
              return
            }

            const data = result.data as GetFileTreeResponses[200]
            if (data) {
              set({
                tree: data.tree as FileTreeNode,
                isLoadingTree: false,
              })
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to get file tree",
              isLoadingTree: false,
            })
          }
        },

        readFile: async (path: string, sandboxClient: typeof sandboxClientType) => {
          set({ isLoadingContent: true, error: null })

          try {
            const result = await getFileRead({
              query: { path },
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to read file"
              set({ error: errorMsg, isLoadingContent: false })
              return
            }

            const data = result.data as GetFileReadResponses[200]
            if (data) {
              set({
                currentFile: {
                  path,
                  content: data.content,
                },
                isLoadingContent: false,
              })
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to read file",
              isLoadingContent: false,
            })
          }
        },

        clearCurrentFile: () => {
          set({ currentFile: null })
        },

        setError: (error: string | null) => {
          set({ error })
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: "filesystem-store",
      }
    )
  )
}

export type FilesystemStore = ReturnType<typeof createFilesystemStore>
