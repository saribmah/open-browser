import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { FileItem } from "@/features/filesystem"
import type { FileItemData } from "@/features/filesystem/filesystem.store"

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: number
  mentionedFiles?: FileItem[]
}

export interface ChatState {
  activeSessionId: string
  contexts: FileItemData[]
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export interface ChatActions {
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
