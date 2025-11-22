import React, { useRef, useEffect } from "react"
import { FilesystemContext } from "./filesystem.context"
import { createFilesystemStore, type FilesystemStore } from "./filesystem.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"

type FilesystemProviderProps = React.PropsWithChildren

export const FilesystemProvider = ({ children }: FilesystemProviderProps) => {
  const sandboxClient = useSandboxContext(s => s.sandboxClient)
  const storeRef = useRef<FilesystemStore>(createFilesystemStore())

  // Inject sandboxClient into the store whenever it changes
  useEffect(() => {
    const store = storeRef.current
    store.getState().setSandboxClient(sandboxClient)
  }, [sandboxClient])

  return (
    <FilesystemContext.Provider value={storeRef.current}>
      {children}
    </FilesystemContext.Provider>
  )
}
