import React, { useRef, useEffect, useState } from "react"
import { ProjectContext } from "./project.context"
import { createProjectStore, type ProjectStore } from "./project.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"
import { useInstanceContext } from "@/features/instance/instance.context"

type ProjectProviderProps = React.PropsWithChildren

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const sandboxClient = useSandboxContext(s => s.sandboxClient)
  const sandbox = useSandboxContext(s => s.sandbox)
  const instanceInitialized = useInstanceContext(s => s.initialized)
  const storeRef = useRef<ProjectStore>(createProjectStore())
  const projectAddedRef = useRef(false)
  const [isAddingProject, setIsAddingProject] = useState(false)

  // Inject sandboxClient into the store whenever it changes
  useEffect(() => {
    const store = storeRef.current
    store.getState().setSandboxClient(sandboxClient)
  }, [sandboxClient])

  // Add project from sandbox metadata when instance is initialized
  useEffect(() => {
    const addProjectFromMetadata = async () => {
      // Only run once
      if (projectAddedRef.current) return
      
      // Check if all required conditions are met
      if (!instanceInitialized || !sandboxClient || !sandbox?.metadata) {
        return
      }

      const metadata = sandbox.metadata
      const url = metadata.url as string | undefined
      const directory = metadata.directory as string | undefined

      // Ensure we have a URL to add
      if (!url) {
        return
      }

      const store = storeRef.current

      // Mark as processed before the async call to prevent duplicate calls
      projectAddedRef.current = true
      setIsAddingProject(true)

      try {
        await store.getState().addProject({
          url,
          directory,
        })
      } catch (error) {
        console.error("Failed to add project from sandbox metadata:", error)
        // Reset flag on error to allow retry
        projectAddedRef.current = false
      } finally {
        setIsAddingProject(false)
      }
    }

    addProjectFromMetadata()
  }, [instanceInitialized, sandboxClient, sandbox])

  // Show loading state while adding project
  if (isAddingProject) {
    return (
      <ProjectContext.Provider value={storeRef.current}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          fontSize: '14px',
          color: '#666'
        }}>
          Loading project...
        </div>
      </ProjectContext.Provider>
    )
  }

  return (
    <ProjectContext.Provider value={storeRef.current}>
      {children}
    </ProjectContext.Provider>
  )
}
