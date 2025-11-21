import { createContext, useContext } from "react"
import { useStore } from "zustand/react"
import type { FilesystemStoreState, FilesystemStore } from "./filesystem.store"

export const FilesystemContext = createContext<FilesystemStore | null>(null)

export function useFilesystemContext<T>(selector: (state: FilesystemStoreState) => T): T {
  const store = useContext(FilesystemContext)
  if (!store) {
    throw new Error("Missing FilesystemContext.Provider in the tree")
  }
  return useStore(store, selector)
}

// Helper selectors
export const useFiles = () => useFilesystemContext(state => state.files)
export const useFileTree = () => useFilesystemContext(state => state.tree)
export const useCurrentFile = () => useFilesystemContext(state => state.currentFile)
export const useFilesLoading = () => useFilesystemContext(state => state.isLoadingFiles)
export const useTreeLoading = () => useFilesystemContext(state => state.isLoadingTree)
export const useContentLoading = () => useFilesystemContext(state => state.isLoadingContent)
export const useFilesystemError = () => useFilesystemContext(state => state.error)

// Action hooks
export const useGetFileList = () => useFilesystemContext(state => state.getFileList)
export const useGetFileTree = () => useFilesystemContext(state => state.getFileTree)
export const useReadFile = () => useFilesystemContext(state => state.readFile)
export const useClearCurrentFile = () => useFilesystemContext(state => state.clearCurrentFile)
