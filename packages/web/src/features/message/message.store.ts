import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { getSessionIdMessages } from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
import type { GetSessionIdMessagesResponses } from "@/client/sandbox/types.gen"
import { eventBus } from "@/lib/event-bus"

// Use generated types from the API
export type Message = GetSessionIdMessagesResponses[200][number]

export interface MessageState {
  sessionId: string
  messages: Message[]
  isLoading: boolean
  error: string | null
  sandboxClient: typeof sandboxClientType | null
}

export interface MessageActions {
  getMessages: () => Promise<void>
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  setError: (error: string | null) => void
  setSandboxClient: (client: typeof sandboxClientType | null) => void
  initializeEventListeners: () => () => void
  reset: () => void
}

export type MessageStoreState = MessageState & MessageActions

export const createMessageStore = (sessionId: string) => {
  const initialState: MessageState = {
    sessionId,
    messages: [],
    isLoading: false,
    error: null,
    sandboxClient: null,
  }

  return create<MessageStoreState>()(
    devtools(
      (set, get) => ({
        // Initial state
        ...initialState,

        // Actions
        getMessages: async () => {
          set({ isLoading: true, error: null })

          const { sandboxClient, sessionId } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isLoading: false })
            return
          }

          try {
            const result = await getSessionIdMessages({
              client: sandboxClient,
              path: { id: sessionId },
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to get messages"
              set({ error: errorMsg, isLoading: false })
              return
            }

            const data = result.data as GetSessionIdMessagesResponses[200]
            if (data) {
              set({
                messages: data || [],
                isLoading: false,
              })
            } else {
              set({ isLoading: false })
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to get messages",
              isLoading: false,
            })
          }
        },

        addMessage: (message: Message) => {
          set((state) => ({
            messages: [...state.messages, message],
          }))
        },

        updateMessage: (messageId: string, updates: Partial<Message>) => {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.info.id === messageId ? { ...m, info: { ...m.info, ...updates } } : m
            ),
          }))
        },

        setError: (error: string | null) => {
          set({ error })
        },

        setSandboxClient: (client: typeof sandboxClientType | null) => {
          set({ sandboxClient: client })
        },

        initializeEventListeners: () => {
          const currentSessionId = get().sessionId

          // Subscribe to message.updated events for this session
          const unsubscribeMessageUpdated = eventBus.on(
            "message.updated",
            (event) => {
              const messageData = (event.data as any)?.info
              if (messageData && messageData.sessionID === currentSessionId) {
                console.log("[Message Store] Message updated event:", messageData)
                
                set((state) => {
                  const existingIndex = state.messages.findIndex(
                    (m) => m.info.id === messageData.id
                  )

                  if (existingIndex >= 0) {
                    // Update existing message
                    const updatedMessages = [...state.messages]
                    const existingMessage = updatedMessages[existingIndex]
                    if (existingMessage) {
                      updatedMessages[existingIndex] = {
                        ...existingMessage,
                        info: { ...existingMessage.info, ...messageData },
                      }
                      return { messages: updatedMessages }
                    }
                  }
                  // Don't add messages without parts array from event
                  return state
                })
              }
            }
          )

          // Subscribe to message.part.updated events for this session
          const unsubscribePartUpdated = eventBus.on(
            "message.part.updated",
            (event) => {
              const part = (event.data as any)?.part
              if (part && part.sessionID === currentSessionId) {
                console.log("[Message Store] Message part updated event:", part)

                set((state) => {
                  const messageIndex = state.messages.findIndex(
                    (m) => m.info.id === part.messageID
                  )

                  if (messageIndex >= 0) {
                    // Update the parts array for this message
                    const updatedMessages = [...state.messages]
                    const message = updatedMessages[messageIndex]
                    
                    if (message) {
                      const partIndex = message.parts.findIndex((p) => p.id === part.id)

                      if (partIndex >= 0) {
                        // Update existing part
                        message.parts[partIndex] = part
                      } else {
                        // Add new part
                        message.parts.push(part)
                      }

                      return { messages: updatedMessages }
                    }
                  }

                  return state
                })
              }
            }
          )

          // Subscribe to message.removed events for this session
          const unsubscribeMessageRemoved = eventBus.on(
            "message.removed",
            (event) => {
              const { sessionID, messageID } = (event.data as any) || {}
              if (sessionID === currentSessionId && messageID) {
                console.log("[Message Store] Message removed event:", messageID)
                set((state) => ({
                  messages: state.messages.filter((m) => m.info.id !== messageID),
                }))
              }
            }
          )

          // Subscribe to message.part.removed events for this session
          const unsubscribePartRemoved = eventBus.on(
            "message.part.removed",
            (event) => {
              const { sessionID, messageID, partID } = (event.data as any) || {}
              if (sessionID === currentSessionId && messageID && partID) {
                console.log("[Message Store] Message part removed event:", partID)
                
                set((state) => {
                  const messageIndex = state.messages.findIndex(
                    (m) => m.info.id === messageID
                  )

                  if (messageIndex >= 0) {
                    const updatedMessages = [...state.messages]
                    const message = updatedMessages[messageIndex]
                    
                    if (message) {
                      message.parts = message.parts.filter((p) => p.id !== partID)
                      return { messages: updatedMessages }
                    }
                  }

                  return state
                })
              }
            }
          )

          // Return cleanup function
          return () => {
            unsubscribeMessageUpdated()
            unsubscribePartUpdated()
            unsubscribeMessageRemoved()
            unsubscribePartRemoved()
          }
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: `message-store-${sessionId}`,
      }
    )
  )
}

export type MessageStore = ReturnType<typeof createMessageStore>
