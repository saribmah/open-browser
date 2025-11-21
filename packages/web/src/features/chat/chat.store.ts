import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { MentionFile } from "@/components/FileMention"
import type { Context } from "@/components/ContextItem"
import type { Tab } from "@/components/TabBar"

export interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: number
  mentionedFiles?: MentionFile[]
}

export interface ChatState {
  tabs: Tab[]
  activeTabId: string
  contexts: Context[]
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
}

export interface ChatActions {
  // Tab management
  addTab: (tab: Tab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  
  // Context management
  addContext: (context: Context) => void
  removeContext: (id: string) => void
  
  // Message management
  sendMessage: (content: string, mentionedFiles?: MentionFile[]) => Promise<void>
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
    tabs: [{ id: "1", title: "new session", type: "chat" }],
    activeTabId: "1",
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

        // Tab management
        addTab: (tab: Tab) => {
          set((state) => ({
            tabs: [...state.tabs, tab],
            activeTabId: tab.id,
          }))
        },

        removeTab: (id: string) => {
          set((state) => {
            const newTabs = state.tabs.filter((tab) => tab.id !== id)
            let newActiveTabId = state.activeTabId

            // If we're closing the active tab, switch to the last tab
            if (state.activeTabId === id && newTabs.length > 0) {
              const lastTab = newTabs[newTabs.length - 1]
              newActiveTabId = lastTab?.id || state.activeTabId
            }

            return {
              tabs: newTabs,
              activeTabId: newActiveTabId,
            }
          })
        },

        setActiveTab: (id: string) => {
          set({ activeTabId: id })
        },

        // Context management
        addContext: (context: Context) => {
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
        sendMessage: async (content: string, mentionedFiles?: MentionFile[]) => {
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
