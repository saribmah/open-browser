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

// Use generated types from the API
export type FileItem = GetFileListResponses[200]['files'][number]
export type FileType = FileItem['type']

// FileTreeNode needs to be recursive, but the generated type from OpenAPI doesn't support this
// So we extend it to make children recursive
type BaseFileTreeNode = GetFileListResponses[200]['files'][number]
export type FileTreeNode = BaseFileTreeNode & {
  children?: FileTreeNode[]
}

export type FileContent = GetFileReadResponses[200] & { path: string }

export interface FilesystemState {
  files: FileItem[]
  tree: FileTreeNode | null
  currentFile: FileContent | null
  isLoadingFiles: boolean
  isLoadingTree: boolean
  isLoadingContent: boolean
  error: string | null
  sandboxClient: typeof sandboxClientType | null
}

export interface FilesystemActions {
  getFileList: (path: string) => Promise<void>
  getFileTree: (path: string, maxDepth: number) => Promise<void>
  readFile: (path: string) => Promise<void>
  clearCurrentFile: () => void
  setError: (error: string | null) => void
  reset: () => void
  setSandboxClient: (client: typeof sandboxClientType | null) => void
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
    sandboxClient: null,
  }

  return create<FilesystemStoreState>()(
    devtools(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Actions
        getFileList: async (path: string) => {
          set({ isLoadingFiles: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoadingFiles: false })
            return
          }

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

        getFileTree: async (path: string, maxDepth: number) => {
          set({ isLoadingTree: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoadingTree: false })
            return
          }

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
                tree: data.tree,
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

        readFile: async (path: string) => {
          set({ isLoadingContent: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoadingContent: false })
            return
          }

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

        setSandboxClient: (client: typeof sandboxClientType | null) => {
          set({ sandboxClient: client })
        },
      }),
      {
        name: "filesystem-store",
      }
    )
  )
}

export type FilesystemStore = ReturnType<typeof createFilesystemStore>
