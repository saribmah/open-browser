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
  PostInstanceProjectAddData,
} from "@/client/sandbox/types.gen"

// Use generated types from the API
export type Project = GetInstanceProjectsResponses[200][number]
export type ProjectType = Project['type']
export type AddProjectParams = NonNullable<PostInstanceProjectAddData['body']>

export interface ProjectState {
  projects: Project[]
  isLoading: boolean
  isLoadingProjects: boolean
  error: string | null
  sandboxClient: typeof sandboxClientType | null
}

export interface ProjectActions {
  getAllProjects: () => Promise<void>
  addProject: (params: AddProjectParams) => Promise<boolean>
  removeProject: (projectId: string) => Promise<boolean>
  clearProject: () => void
  setError: (error: string | null) => void
  setSandboxClient: (client: typeof sandboxClientType | null) => void
}

export type ProjectStoreState = ProjectState & ProjectActions

export const createProjectStore = () => {
  const initialState: ProjectState = {
    projects: [],
    isLoading: false,
    isLoadingProjects: false,
    error: null,
    sandboxClient: null,
  }

  return create<ProjectStoreState>()(
    devtools(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Actions
        getAllProjects: async () => {
          set({ isLoadingProjects: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoadingProjects: false })
            return
          }

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
              set({ projects: data, isLoadingProjects: false })
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to get projects",
              isLoadingProjects: false,
            })
          }
        },

        addProject: async (params: AddProjectParams) => {
          set({ isLoading: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoading: false })
            return false
          }

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
            
            // Add the new project to local state if successful
            if (data?.success && data.project) {
              set((state) => ({
                projects: [...state.projects, data.project!],
                isLoading: false,
              }))
            } else {
              set({ isLoading: false })
            }
            
            return data?.success || false
          } catch (err: any) {
            set({
              error: err.message || "Failed to add project",
              isLoading: false,
            })
            return false
          }
        },

        removeProject: async (projectId: string) => {
          set({ isLoading: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoading: false })
            return false
          }

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

        setSandboxClient: (client: typeof sandboxClientType | null) => {
          set({ sandboxClient: client })
        },
      }),
      {
        name: "project-store",
      }
    )
  )
}

export type ProjectStore = ReturnType<typeof createProjectStore>
