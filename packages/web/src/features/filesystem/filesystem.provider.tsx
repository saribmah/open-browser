import React, { useRef } from "react"
import { FilesystemContext } from "./filesystem.context"
import { createFilesystemStore, type FilesystemStore } from "./filesystem.store"

type FilesystemProviderProps = React.PropsWithChildren

export const FilesystemProvider = ({ children }: FilesystemProviderProps) => {
  const storeRef = useRef<FilesystemStore>(createFilesystemStore())

  return (
    <FilesystemContext.Provider value={storeRef.current}>
      {children}
    </FilesystemContext.Provider>
  )
}
