import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { postSessionIdMessage } from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
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
  sandboxClient: typeof sandboxClientType | null
}

export interface ChatActions {
  // Message management
  sendMessage: (content: string, mentionedFiles?: FileItem[]) => Promise<void>
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void

  // State management
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSandboxClient: (client: typeof sandboxClientType | null) => void
  setActiveSessionId: (sessionId: string) => void
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
    sandboxClient: null,
  }

  return create<ChatStoreState>()(
    devtools(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Message management
        sendMessage: async (content: string, mentionedFiles?: FileItem[]) => {
          set({ isLoading: true, error: null })

          const state = get()
          const { sandboxClient, activeSessionId } = state

          if (!sandboxClient) {
            set({
              error: "Sandbox client not available",
              isLoading: false,
            })
            return
          }

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

            // Build the parts array for the API request
            const parts: Array<{ type: "text"; text: string } | { type: "file"; path: string }> = [
              { type: "text", text: content }
            ]

            // Add file parts if there are mentioned files
            if (mentionedFiles && mentionedFiles.length > 0) {
              mentionedFiles.forEach(file => {
                parts.push({ type: "file", path: file.path })
              })
            }

            // Send message to the API
            const response = await postSessionIdMessage({
              client: sandboxClient,
              path: { id: activeSessionId },
              body: {
                parts,
              },
            })

            if (response.error) {
              throw new Error(response.error.error || "Failed to send message")
            }

            // Add assistant message if we got a response
            if (response.data) {
              const assistantMessage: ChatMessage = {
                id: response.data.info.id,
                content: response.data.parts
                  .filter(part => part.type === "text")
                  .map(part => (part as any).text)
                  .join("\n"),
                role: "assistant",
                timestamp: response.data.info.time.created,
              }

              set((state) => ({
                messages: [...state.messages, assistantMessage],
                isLoading: false,
              }))
            } else {
              set({ isLoading: false })
            }
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

        setSandboxClient: (client: typeof sandboxClientType | null) => {
          set({ sandboxClient: client })
        },

        setActiveSessionId: (sessionId: string) => {
          set({ activeSessionId: sessionId })
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
