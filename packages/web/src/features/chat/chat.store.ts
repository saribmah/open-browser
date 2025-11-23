import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { postSessionIdMessage } from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
import type { SseEnvelope } from "@/client/sandbox/types.gen"
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

            // Send message via SSE stream
            const sseResponse = await postSessionIdMessage({
              client: sandboxClient,
              path: { id: activeSessionId },
              body: {
                parts,
              },
            })

            // Track assistant message parts as they come in
            let assistantMessageId: string | null = null
            let assistantContent = ""

            // Listen to SSE events - the stream yields already-parsed SseEnvelope objects
            for await (const event of sseResponse.stream) {
              // The SSE client has already parsed the JSON for us
              // event is typed as SseEnvelope from the generated types
              
              console.log("SSE Event:", event)

              // Handle different event types with proper typing
              if (event.type === "stream.end") {
                // Stream has ended - clean exit
                const reason = (event.data as any)?.reason
                if (reason) {
                  console.log("Stream ended:", reason)
                }
                break
              } else if (event.type === "message.part.updated") {
                // event.data contains the EventMessagePartUpdated properties
                const part = (event.data as any).part
                if (part && part.type === "text") {
                  assistantMessageId = part.messageID
                  assistantContent += part.text || ""
                  
                  // Update or add assistant message
                  set((state) => {
                    const existingIndex = state.messages.findIndex(
                      m => m.id === assistantMessageId
                    )
                    
                    if (existingIndex >= 0 && assistantMessageId) {
                      // Update existing message
                      const updatedMessages = [...state.messages]
                      const existing = updatedMessages[existingIndex]
                      if (existing) {
                        updatedMessages[existingIndex] = {
                          id: assistantMessageId,
                          content: assistantContent,
                          role: "assistant",
                          timestamp: existing.timestamp,
                          mentionedFiles: existing.mentionedFiles,
                        }
                      }
                      return { messages: updatedMessages }
                    } else if (assistantMessageId) {
                      // Add new assistant message
                      const assistantMessage: ChatMessage = {
                        id: assistantMessageId,
                        content: assistantContent,
                        role: "assistant",
                        timestamp: Date.now(),
                      }
                      return { messages: [...state.messages, assistantMessage] }
                    }
                    return state
                  })
                }
              } else if (event.type === "message.completed") {
                // Final message data
                console.log("Message completed:", event.data)
              } else if (event.type === "error") {
                const errorData = event.data as any
                throw new Error(errorData.message || "Stream error")
              }
            }

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
