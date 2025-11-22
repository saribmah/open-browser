import React, { useRef, useEffect } from "react"
import { ProjectContext } from "./project.context"
import { createProjectStore, type ProjectStore } from "./project.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"
import { useInstanceContext } from "@/features/instance/instance.context"

type ProjectProviderProps = React.PropsWithChildren

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const sandboxClient = useSandboxContext(s => s.sandboxClient)
  const instanceInitialized = useInstanceContext(s => s.initialized)
  const storeRef = useRef<ProjectStore>(createProjectStore())

  // Inject sandboxClient into the store whenever it changes
  useEffect(() => {
    const store = storeRef.current
    store.getState().setSandboxClient(sandboxClient)
  }, [sandboxClient])

  return (
    <ProjectContext.Provider value={storeRef.current}>
      {children}
    </ProjectContext.Provider>
  )
}
