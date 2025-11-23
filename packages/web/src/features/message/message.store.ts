import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { getSessionIdMessages, postSessionIdMessage } from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
import type { GetSessionIdMessagesResponses } from "@/client/sandbox/types.gen"
import { eventBus } from "@/lib/event-bus"
import { sseHandler } from "@/lib/sse-handler"
import { binarySearch } from "@/lib/binary-search"

// Use generated types from the API
export type Message = GetSessionIdMessagesResponses[200][number]

export interface MessageState {
  sessionId: string
  messages: Message[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  sandboxClient: typeof sandboxClientType | null
}

export interface MessageActions {
  getMessages: () => Promise<void>
  sendMessage: (content: string, mentionedFiles?: Array<{ path: string }>) => Promise<void>
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
    isSending: false,
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

        sendMessage: async (content: string, mentionedFiles?: Array<{ path: string }>) => {
          set({ isSending: true, error: null })

          const { sandboxClient, sessionId } = get()
          if (!sandboxClient) {
            set({ error: "Sandbox client not available", isSending: false })
            return
          }

          try {
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
              path: { id: sessionId },
              body: {
                parts,
              },
            })

            // Process the SSE stream through the handler
            // This will emit events to the event bus which will update the store
            await sseHandler.handle(sseResponse)

            set({ isSending: false })
          } catch (err: any) {
            set({
              error: err.message || "Failed to send message",
              isSending: false,
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
              const messageInfo = (event.data as any)?.info
              if (messageInfo && messageInfo.sessionID === currentSessionId) {
                console.log("[Message Store] Message updated event:", messageInfo)
                
                set((state) => {
                  const messages = state.messages
                  const result = binarySearch(messages, messageInfo.id, (m) => m.info.id)

                  if (result.found) {
                    // Update existing message - merge the new info with existing
                    const updatedMessages = [...messages]
                    const existingMessage = updatedMessages[result.index]
                    if (existingMessage) {
                      updatedMessages[result.index] = {
                        ...existingMessage,
                        info: { ...existingMessage.info, ...messageInfo },
                      }
                      return { messages: updatedMessages }
                    }
                  } else {
                    // Message not found - insert at the correct position
                    // Create new message with info and empty parts array
                    const updatedMessages = [...messages]
                    updatedMessages.splice(result.index, 0, {
                      info: messageInfo,
                      parts: [],
                    })
                    return { messages: updatedMessages }
                  }
                  
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
                  // Find the message using binary search
                  const messages = state.messages
                  const messageResult = binarySearch(messages, part.messageID, (m) => m.info.id)

                  if (messageResult.found) {
                    const updatedMessages = [...messages]
                    const message = updatedMessages[messageResult.index]
                    
                    if (message) {
                      // Find or insert the part using binary search
                      const parts = message.parts
                      const partResult = binarySearch(parts, part.id, (p) => p.id)

                      // Clone the parts array
                      const updatedParts = [...parts]

                      if (partResult.found) {
                        // Update existing part
                        updatedParts[partResult.index] = part
                      } else {
                        // Insert new part at the correct position
                        updatedParts.splice(partResult.index, 0, part)
                      }

                      // Update the message with new parts
                      updatedMessages[messageResult.index] = {
                        ...message,
                        parts: updatedParts,
                      }

                      return { messages: updatedMessages }
                    }
                  } else {
                    // Message doesn't exist yet - create it with this part
                    const updatedMessages = [...messages]
                    updatedMessages.splice(messageResult.index, 0, {
                      info: {
                        id: part.messageID,
                        sessionID: part.sessionID,
                        role: "assistant",
                        time: { created: Date.now() },
                        parentID: "",
                        modelID: "",
                        providerID: "",
                        mode: "",
                        path: { cwd: "", root: "" },
                        cost: 0,
                        tokens: {
                          input: 0,
                          output: 0,
                          reasoning: 0,
                          cache: { read: 0, write: 0 },
                        },
                      },
                      parts: [part],
                    })
                    return { messages: updatedMessages }
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
                
                set((state) => {
                  const messages = state.messages
                  const result = binarySearch(messages, messageID, (m) => m.info.id)

                  if (result.found) {
                    // Remove the message at the found index
                    const updatedMessages = [...messages]
                    updatedMessages.splice(result.index, 1)
                    return { messages: updatedMessages }
                  }

                  return state
                })
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
                  const messages = state.messages
                  const messageResult = binarySearch(messages, messageID, (m) => m.info.id)

                  if (messageResult.found) {
                    const updatedMessages = [...messages]
                    const message = updatedMessages[messageResult.index]
                    
                    if (message) {
                      const parts = message.parts
                      const partResult = binarySearch(parts, partID, (p) => p.id)

                      if (partResult.found) {
                        // Remove the part at the found index
                        const updatedParts = [...parts]
                        updatedParts.splice(partResult.index, 1)

                        updatedMessages[messageResult.index] = {
                          ...message,
                          parts: updatedParts,
                        }

                        return { messages: updatedMessages }
                      }
                    }
                  }

                  return state
                })
              }
            }
          )

          // Subscribe to stream.end events to reset isSending state
          const unsubscribeStreamEnd = eventBus.on("stream.end", (event) => {
            const reason = (event.data as any)?.reason
            console.log("[Message Store] Stream ended:", reason || "No reason provided")
            set({ isSending: false })
          })

          // Return cleanup function
          return () => {
            unsubscribeMessageUpdated()
            unsubscribePartUpdated()
            unsubscribeMessageRemoved()
            unsubscribePartRemoved()
            unsubscribeStreamEnd()
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
