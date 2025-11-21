import { createContext, useContext } from "react"
import { useStore } from "zustand/react"
import type { ProjectStoreState, ProjectStore } from "./project.store"

export const ProjectContext = createContext<ProjectStore | null>(null)

export function useProjectContext<T>(selector: (state: ProjectStoreState) => T): T {
  const store = useContext(ProjectContext)
  if (!store) {
    throw new Error("Missing ProjectContext.Provider in the tree")
  }
  return useStore(store, selector)
}

// Helper selectors
export const useCurrentProject = () => useProjectContext(state => state.currentProject)
export const useProjects = () => useProjectContext(state => state.projects)
export const useProjectLoading = () => useProjectContext(state => state.isLoading)
export const useProjectsLoading = () => useProjectContext(state => state.isLoadingProjects)
export const useProjectError = () => useProjectContext(state => state.error)
export const useGetCurrentProject = () => useProjectContext(state => state.getCurrentProject)
export const useGetAllProjects = () => useProjectContext(state => state.getAllProjects)
export const useAddProject = () => useProjectContext(state => state.addProject)
export const useRemoveProject = () => useProjectContext(state => state.removeProject)
export const useSetCurrentProject = () => useProjectContext(state => state.setCurrentProject)
export const useClearProject = () => useProjectContext(state => state.clearProject)
