import React, { useRef, useEffect } from "react"
import { FilesystemContext } from "./filesystem.context"
import { createFilesystemStore, type FilesystemStore } from "./filesystem.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"
import { useInstanceContext } from "@/features/instance/instance.context"
import { useProjects } from "@/features/project"

type FilesystemProviderProps = React.PropsWithChildren

export const FilesystemProvider = ({ children }: FilesystemProviderProps) => {
  const sandboxClient = useSandboxContext(s => s.sandboxClient)
  const instanceInitialized = useInstanceContext(s => s.initialized)
  const projects = useProjects()
  const storeRef = useRef<FilesystemStore>(createFilesystemStore())

  // Inject sandboxClient into the store whenever it changes
  useEffect(() => {
    const store = storeRef.current
    store.getState().setSandboxClient(sandboxClient)
    
    // Load file tree from root when both sandboxClient is available AND instance is initialized
    if (sandboxClient && instanceInitialized) {
      store.getState().getFileTree("/", 3)
    }
  }, [sandboxClient, instanceInitialized, projects])

  return (
    <FilesystemContext.Provider value={storeRef.current}>
      {children}
    </FilesystemContext.Provider>
  )
}
