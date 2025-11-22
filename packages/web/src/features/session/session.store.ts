import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  getSession,
  postSession,
} from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
import type {
  GetSessionResponses,
  PostSessionResponses,
} from "@/client/sandbox/types.gen"

export type Session = {
  id: string
  title?: string
  createdAt?: string
  updatedAt?: string
}

export interface SessionState {
  sessions: Session[]
  isLoading: boolean
  error: string | null
  sandboxClient: typeof sandboxClientType | null
}

export interface SessionActions {
  getAllSessions: () => Promise<void>
  createSession: () => Promise<Session | null>
  setError: (error: string | null) => void
  setSandboxClient: (client: typeof sandboxClientType | null) => void
  reset: () => void
}

export type SessionStoreState = SessionState & SessionActions

export const createSessionStore = () => {
  const initialState: SessionState = {
    sessions: [],
    isLoading: false,
    error: null,
    sandboxClient: null,
  }

  return create<SessionStoreState>()(
    devtools(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Actions
        getAllSessions: async () => {
          set({ isLoading: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoading: false })
            return
          }

          try {
            const result = await getSession({
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to get sessions"
              set({ error: errorMsg, isLoading: false })
              return
            }

            const data = result.data as GetSessionResponses[200]
            if (data) {
              set({
                sessions: data.sessions || [],
                isLoading: false,
              })
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to get sessions",
              isLoading: false,
            })
          }
        },

        createSession: async () => {
          set({ isLoading: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoading: false })
            return null
          }

          try {
            const result = await postSession({
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to create session"
              set({ error: errorMsg, isLoading: false })
              return null
            }

            const data = result.data as PostSessionResponses[200]
            if (data) {
              // Add to sessions list
              set((state) => ({
                sessions: [...state.sessions, data],
                isLoading: false,
              }))
              return data
            }

            set({ isLoading: false })
            return null
          } catch (err: any) {
            set({
              error: err.message || "Failed to create session",
              isLoading: false,
            })
            return null
          }
        },

        setError: (error: string | null) => {
          set({ error })
        },

        setSandboxClient: (client: typeof sandboxClientType | null) => {
          set({ sandboxClient: client })
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: "session-store",
      }
    )
  )
}

export type SessionStore = ReturnType<typeof createSessionStore>
