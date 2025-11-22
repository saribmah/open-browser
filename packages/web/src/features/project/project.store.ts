import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  getInstanceProjects,
  postInstanceProjectAdd,
  postInstanceProjectRemove,
} from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
import type {
  GetInstanceProjectsResponses,
  PostInstanceProjectAddResponses,
  PostInstanceProjectRemoveResponses,
} from "@/client/sandbox/types.gen"

export type ProjectType = "GITHUB" | "ARXIV"

export type Project = {
  id: string
  type: ProjectType
  url: string
  directory: string
  metadata?: {
    [key: string]: unknown
  }
}

export interface AddProjectParams {
  url: string
  directory?: string
}

export interface ProjectState {
  projects: Project[]
  isLoading: boolean
  isLoadingProjects: boolean
  error: string | null
}

export interface ProjectActions {
  getAllProjects: (sandboxClient: typeof sandboxClientType) => Promise<void>
  addProject: (params: AddProjectParams, sandboxClient: typeof sandboxClientType) => Promise<boolean>
  removeProject: (projectId: string, sandboxClient: typeof sandboxClientType) => Promise<boolean>
  clearProject: () => void
  setError: (error: string | null) => void
}

export type ProjectStoreState = ProjectState & ProjectActions

export const createProjectStore = () => {
  const initialState: ProjectState = {
    projects: [],
    isLoading: false,
    isLoadingProjects: false,
    error: null,
  }

  return create<ProjectStoreState>()(
    devtools(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        getAllProjects: async (sandboxClient: typeof sandboxClientType) => {
          set({ isLoadingProjects: true, error: null })

          try {
            const result = await getInstanceProjects({
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to get projects"
              set({ error: errorMsg, isLoadingProjects: false })
              return
            }

            const data = result.data as GetInstanceProjectsResponses[200]
            if (data) {
              const projects = data.map((project) => ({
                id: project.id,
                type: project.type,
                url: project.url,
                directory: project.directory,
                metadata: project.metadata,
              }))
              set({ projects, isLoadingProjects: false })
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to get projects",
              isLoadingProjects: false,
            })
          }
        },

        addProject: async (params: AddProjectParams, sandboxClient: typeof sandboxClientType) => {
          set({ isLoading: true, error: null })

          try {
            const result = await postInstanceProjectAdd({
              body: params,
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to add project"
              set({ error: errorMsg, isLoading: false })
              return false
            }

            const data = result.data as PostInstanceProjectAddResponses[200]
            set({ isLoading: false })
            return data?.success || false
          } catch (err: any) {
            set({
              error: err.message || "Failed to add project",
              isLoading: false,
            })
            return false
          }
        },

        removeProject: async (projectId: string, sandboxClient: typeof sandboxClientType) => {
          set({ isLoading: true, error: null })

          try {
            const result = await postInstanceProjectRemove({
              body: { projectId },
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to remove project"
              set({ error: errorMsg, isLoading: false })
              return false
            }

            const data = result.data as PostInstanceProjectRemoveResponses[200]
            
            // Remove from local state if successful
            if (data?.success) {
              set((state) => ({
                projects: state.projects.filter((p) => p.id !== projectId),
                isLoading: false,
              }))
            } else {
              set({ isLoading: false })
            }

            return data?.success || false
          } catch (err: any) {
            set({
              error: err.message || "Failed to remove project",
              isLoading: false,
            })
            return false
          }
        },

        clearProject: () => {
          set(initialState)
        },

        setError: (error: string | null) => {
          set({ error })
        },
      }),
      {
        name: "project-store",
      }
    )
  )
}

export type ProjectStore = ReturnType<typeof createProjectStore>
