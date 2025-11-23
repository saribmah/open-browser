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

            // Listen to SSE events
            for await (const rawEvent of sseResponse.stream) {
              // Parse the SSE event data
              // The stream yields strings, we need to parse the JSON envelope
              let event: { v: number; type: string; data: any; ts: number }
              
              try {
                // rawEvent is the string data from SSE
                const eventStr = typeof rawEvent === 'string' ? rawEvent : JSON.stringify(rawEvent)
                
                // Check if this is the [DONE] signal
                if (eventStr === "[DONE]") {
                  break
                }
                
                event = JSON.parse(eventStr)
              } catch {
                console.warn("Failed to parse SSE event:", rawEvent)
                continue
              }

              console.log("SSE Event:", event)

              // Handle different event types
              if (event.type === "message.part.updated" || event.type === "part.updated") {
                const part = event.data
                if (part.type === "text") {
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
                throw new Error(event.data.message || "Stream error")
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
