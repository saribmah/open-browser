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
import { eventBus } from "@/lib/event-bus"
import { binarySearch } from "@/lib/binary-search"

// Use generated types from the API
export type Session = GetSessionResponses[200]['sessions'][number]

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
  isLoading: boolean
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
  clearAllSessions: () => void
  setActiveSession: (id: string) => void
  setError: (error: string | null) => void
  setSandboxClient: (client: typeof sandboxClientType | null) => void
  initializeEventListeners: () => () => void
  reset: () => void
}

export type SessionStoreState = SessionState & SessionActions

export const createSessionStore = () => {
  const initialState: SessionState = {
    sessions: [{ id: "1", title: "new session", type: "chat", ephemeral: true }],
    visibleSessionIds: ["1"], // Store only IDs
    activeSessionId: "1",
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

        clearAllSessions: () => {
          set((state) => {
            // Create a new ephemeral session
            const newSession: UISession = {
              id: Date.now().toString(),
              title: "new session",
              type: "chat",
              ephemeral: true,
            }

            // Keep all sessions but only show the new ephemeral session
            return {
              sessions: [...state.sessions, newSession],
              visibleSessionIds: [newSession.id],
              activeSessionId: newSession.id,
            }
          })
        },

        setActiveSession: (id: string) => {
          set({ activeSessionId: id })
        },

        setError: (error: string | null) => {
          set({ error })
        },

        setSandboxClient: (client: typeof sandboxClientType | null) => {
          set({ sandboxClient: client })
        },

        initializeEventListeners: () => {
          // Subscribe to session.created events
          const unsubscribeCreated = eventBus.on("session.created", (event) => {
            const sessionInfo = (event.data as any)?.info
            if (sessionInfo) {
              console.log("[Session Store] Session created event:", sessionInfo)
              
              set((state) => {
                const sessions = state.sessions
                const result = binarySearch(sessions, sessionInfo.id, (s) => s.id)

                if (!result.found) {
                  // Insert at correct sorted position
                  const updatedSessions = [...sessions]
                  updatedSessions.splice(result.index, 0, sessionInfo)

                  return {
                    sessions: updatedSessions,
                    visibleSessionIds: [...state.visibleSessionIds, sessionInfo.id],
                  }
                }

                // Session already exists, just ensure it's visible
                const visibleSessionExists = state.visibleSessionIds.includes(sessionInfo.id)
                return {
                  visibleSessionIds: visibleSessionExists 
                    ? state.visibleSessionIds 
                    : [...state.visibleSessionIds, sessionInfo.id],
                }
              })
            }
          })

          // Subscribe to session.updated events
          const unsubscribeUpdated = eventBus.on("session.updated", (event) => {
            const sessionInfo = (event.data as any)?.info
            if (sessionInfo) {
              console.log("[Session Store] Session updated event:", sessionInfo)
              
              set((state) => {
                const sessions = state.sessions
                const result = binarySearch(sessions, sessionInfo.id, (s) => s.id)

                if (result.found) {
                  // Update existing session - merge properties
                  const updatedSessions = [...sessions]
                  const existingSession = updatedSessions[result.index]
                  if (existingSession) {
                    updatedSessions[result.index] = {
                      ...existingSession,
                      ...sessionInfo,
                    }
                    return { sessions: updatedSessions }
                  }
                } else {
                  // Session doesn't exist - insert at correct position
                  const updatedSessions = [...sessions]
                  updatedSessions.splice(result.index, 0, sessionInfo)
                  return { sessions: updatedSessions }
                }

                return state
              })
            }
          })

          // Subscribe to session.deleted events
          const unsubscribeDeleted = eventBus.on("session.deleted", (event) => {
            const sessionInfo = (event.data as any)?.info
            if (sessionInfo) {
              console.log("[Session Store] Session deleted event:", sessionInfo)
              
              set((state) => {
                const sessions = state.sessions
                const result = binarySearch(sessions, sessionInfo.id, (s) => s.id)

                if (result.found) {
                  // Remove session at found index
                  const updatedSessions = [...sessions]
                  updatedSessions.splice(result.index, 1)

                  return {
                    sessions: updatedSessions,
                    visibleSessionIds: state.visibleSessionIds.filter(
                      (id) => id !== sessionInfo.id
                    ),
                  }
                }

                return state
              })
            }
          })

          // Return cleanup function
          return () => {
            unsubscribeCreated()
            unsubscribeUpdated()
            unsubscribeDeleted()
          }
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
