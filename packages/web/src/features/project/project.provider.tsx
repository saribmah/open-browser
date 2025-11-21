import React, { useRef, useEffect } from "react"
import { ProjectContext } from "./project.context"
import { createProjectStore, type ProjectStore } from "./project.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"
import { useInstanceContext } from "@/features/instance/instance.context"

type ProjectProviderProps = React.PropsWithChildren

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const sandbox = useSandboxContext(s => s.sandbox)
  const instanceInitialized = useInstanceContext(s => s.initialized)
  const storeRef = useRef<ProjectStore>(createProjectStore())

  // Keep project store in sync with sandbox changes
  // Only sync when instance is initialized
  useEffect(() => {
    if (sandbox && instanceInitialized) {
      // You can extract project info from sandbox metadata if available
      // For now, we'll just keep it synced
      const store = storeRef.current
      // Example: store.getState().setProject(sandbox.id, sandbox.metadata?.projectName || 'Unnamed')
    }
  }, [sandbox, instanceInitialized])

  return (
    <ProjectContext.Provider value={storeRef.current}>
      {children}
    </ProjectContext.Provider>
  )
}
