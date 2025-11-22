import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  getSession,
  postSession,
  getSessionIdMessages,
} from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
import type {
  GetSessionResponses,
  PostSessionResponses,
  GetSessionIdMessagesResponses,
} from "@/client/sandbox/types.gen"

// Use generated types from the API
export type Session = GetSessionResponses[200]['sessions'][number]
export type Message = GetSessionIdMessagesResponses[200]['messages'][number]

// UISession extends Session with UI-specific fields for sessions
// that are created locally (e.g., via "new tab") before being persisted
export interface UISession extends Partial<Session> {
  id: string
  type?: "chat" | "file"
  ephemeral?: boolean
  fileContent?: string
  filePath?: string
}

export interface SessionState {
  sessions: UISession[] // All sessions (including backend sessions)
  visibleSessionIds: string[] // Only session IDs visible in the top bar
  activeSessionId: string
  messages: Record<string, Message[]> // sessionId -> messages
  isLoading: boolean
  isLoadingMessages: boolean
  error: string | null
  sandboxClient: typeof sandboxClientType | null
}

export interface SessionActions {
  getAllSessions: () => Promise<void>
  createSession: () => Promise<Session | null>
  convertEphemeralToReal: (ephemeralId: string) => Promise<Session | null>
  addUISession: (session: UISession) => void
  updateUISession: (sessionId: string, updates: Partial<UISession>) => void
  removeUISession: (sessionId: string) => void
  setActiveSession: (id: string) => void
  getMessages: (sessionId: string) => Promise<void>
  setError: (error: string | null) => void
  setSandboxClient: (client: typeof sandboxClientType | null) => void
  reset: () => void
}

export type SessionStoreState = SessionState & SessionActions

export const createSessionStore = () => {
  const initialState: SessionState = {
    sessions: [{ id: "1", title: "new session", type: "chat", ephemeral: true }],
    visibleSessionIds: ["1"], // Store only IDs
    activeSessionId: "1",
    messages: {},
    isLoading: false,
    isLoadingMessages: false,
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
              set((state) => {
                // Preserve ephemeral sessions and merge with backend sessions
                const ephemeralSessions = state.sessions.filter((s) => s.ephemeral)
                const backendSessions = data.sessions || []
                
                return {
                  sessions: [...ephemeralSessions, ...backendSessions],
                  // visibleSessions remain unchanged - only show what user has opened
                  isLoading: false,
                }
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
              // Add to both sessions and visible session IDs list
              set((state) => ({
                sessions: [...state.sessions, data],
                visibleSessionIds: [...state.visibleSessionIds, data.id],
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

        convertEphemeralToReal: async (ephemeralId: string) => {
          set({ isLoading: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoading: false })
            return null
          }

          try {
            // Create a real session in the backend
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
              // Replace the ephemeral session with the real session in both lists
              set((state) => {
                const ephemeralSession = state.sessions.find((s) => s.id === ephemeralId)
                const otherSessions = state.sessions.filter((s) => s.id !== ephemeralId)
                const otherVisibleSessionIds = state.visibleSessionIds.filter((id) => id !== ephemeralId)
                const newSession = { ...data, title: ephemeralSession?.title || data.title }
                
                return {
                  sessions: [...otherSessions, newSession],
                  visibleSessionIds: [...otherVisibleSessionIds, data.id],
                  activeSessionId: data.id,
                  isLoading: false,
                }
              })
              return data
            }

            set({ isLoading: false })
            return null
          } catch (err: any) {
            set({
              error: err.message || "Failed to convert session",
              isLoading: false,
            })
            return null
          }
        },

        addUISession: (session: UISession) => {
          set((state) => {
            // Check if session already exists in sessions list
            const sessionExists = state.sessions.some((s) => s.id === session.id)
            const visibleSessionExists = state.visibleSessionIds.includes(session.id)
            
            return {
              sessions: sessionExists ? state.sessions : [...state.sessions, session],
              visibleSessionIds: visibleSessionExists ? state.visibleSessionIds : [...state.visibleSessionIds, session.id],
              activeSessionId: session.id,
            }
          })
        },

        updateUISession: (sessionId: string, updates: Partial<UISession>) => {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, ...updates } : s
            ),
            // visibleSessionIds don't need updating since they're just IDs
          }))
        },

        removeUISession: (sessionId: string) => {
          set((state) => {
            // Don't allow closing the last visible session
            if (state.visibleSessionIds.length <= 1) {
              return state
            }

            const newVisibleSessionIds = state.visibleSessionIds.filter((id) => id !== sessionId)
            let newActiveSessionId = state.activeSessionId

            // If we're closing the active session, switch to the last visible session
            if (state.activeSessionId === sessionId && newVisibleSessionIds.length > 0) {
              const lastSessionId = newVisibleSessionIds[newVisibleSessionIds.length - 1]
              newActiveSessionId = lastSessionId || state.activeSessionId
            }

            return {
              visibleSessionIds: newVisibleSessionIds,
              activeSessionId: newActiveSessionId,
            }
          })
        },

        setActiveSession: (id: string) => {
          set({ activeSessionId: id })
        },

        getMessages: async (sessionId: string) => {
          set({ isLoadingMessages: true, error: null })

          const { sandboxClient } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoadingMessages: false })
            return
          }

          try {
            const result = await getSessionIdMessages({
              client: sandboxClient,
              path: { id: sessionId },
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to get messages"
              set({ error: errorMsg, isLoadingMessages: false })
              return
            }

            const data = result.data as GetSessionIdMessagesResponses[200]
            if (data) {
              set((state) => ({
                messages: {
                  ...state.messages,
                  [sessionId]: data.messages || [],
                },
                isLoadingMessages: false,
              }))
            } else {
              set({ isLoadingMessages: false })
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to get messages",
              isLoadingMessages: false,
            })
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
