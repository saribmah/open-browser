import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { FileItem } from "@/features/filesystem"
import type { FileItemData } from "@/features/filesystem/filesystem.store"
import type { Session } from "@/features/session/components/session-bar.component"

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: number
  mentionedFiles?: FileItem[]
}

export interface ChatState {
  sessions: Session[]
  activeSessionId: string
  contexts: FileItemData[]
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export interface ChatActions {
  // Session management
  addSession: (session: Session) => void
  removeSession: (id: string) => void
  setActiveSession: (id: string) => void
  updateSessionId: (sessionId: string, apiSessionId: string) => void

  // Context management
  addContext: (context: FileItemData) => void
  removeContext: (id: string) => void

  // Message management
  sendMessage: (content: string, mentionedFiles?: FileItem[]) => Promise<void>
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void

  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export type ChatStoreState = ChatState & ChatActions

export const createChatStore = () => {
  const initialState: ChatState = {
    sessions: [{ id: "1", title: "new session", type: "chat" }],
    activeSessionId: "1",
    contexts: [],
    messages: [],
    isLoading: false,
    error: null,
  }

  return create<ChatStoreState>()(
    devtools(
      (set) => ({
        // Initial state
        ...initialState,

        // Session management
        addSession: (session: Session) => {
          set((state) => ({
            sessions: [...state.sessions, session],
            activeSessionId: session.id,
          }))
        },

        removeSession: (id: string) => {
          set((state) => {
            const newSessions = state.sessions.filter((session) => session.id !== id)
            let newActiveSessionId = state.activeSessionId

            // If we're closing the active session, switch to the last session
            if (state.activeSessionId === id && newSessions.length > 0) {
              const lastSession = newSessions[newSessions.length - 1]
              newActiveSessionId = lastSession?.id || state.activeSessionId
            }

            return {
              sessions: newSessions,
              activeSessionId: newActiveSessionId,
            }
          })
        },

        setActiveSession: (id: string) => {
          set({ activeSessionId: id })
        },

        updateSessionId: (sessionId: string, apiSessionId: string) => {
          set((state) => ({
            sessions: state.sessions.map((session) =>
              session.id === sessionId ? { ...session, sessionId: apiSessionId } : session
            ),
          }))
        },

        // Context management
        addContext: (context: FileItemData) => {
          set((state) => ({
            contexts: [...state.contexts, context],
          }))
        },

        removeContext: (id: string) => {
          set((state) => ({
            contexts: state.contexts.filter((context) => context.id !== id),
          }))
        },

        // Message management
        sendMessage: async (content: string, mentionedFiles?: FileItem[]) => {
          set({ isLoading: true, error: null })

          try {
            // Create user message
            const userMessage: ChatMessage = {
              id: Date.now().toString(),
              content,
              role: "user",
              timestamp: Date.now(),
              mentionedFiles,
            }

            // Add user message
            set((state) => ({
              messages: [...state.messages, userMessage],
            }))

            // TODO: Send to API and get response
            // For now, we'll just clear loading state
            set({ isLoading: false })
          } catch (err: any) {
            set({
              error: err.message || "Failed to send message",
              isLoading: false,
            })
          }
        },

        addMessage: (message: ChatMessage) => {
          set((state) => ({
            messages: [...state.messages, message],
          }))
        },

        clearMessages: () => {
          set({ messages: [] })
        },

        // State management
        setLoading: (loading: boolean) => {
          set({ isLoading: loading })
        },

        setError: (error: string | null) => {
          set({ error })
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: "chat-store",
      }
    )
  )
}

export type ChatStore = ReturnType<typeof createChatStore>
