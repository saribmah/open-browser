import { createContext, useContext } from "react"
import { useStore } from "zustand/react"
import type { ChatStoreState, ChatStore } from "./chat.store"

export const ChatContext = createContext<ChatStore | null>(null)

export function useChatContext<T>(selector: (state: ChatStoreState) => T): T {
  const store = useContext(ChatContext)
  if (!store) {
    throw new Error("Missing ChatContext.Provider in the tree")
  }
  return useStore(store, selector)
}

// Helper selectors
export const useChatActiveSessionId = () => useChatContext(state => state.activeSessionId)
export const useContexts = () => useChatContext(state => state.contexts)
export const useChatMessages = () => useChatContext(state => state.messages)
export const useChatLoading = () => useChatContext(state => state.isLoading)
export const useChatError = () => useChatContext(state => state.error)
export const useChatSandboxClient = () => useChatContext(state => state.sandboxClient)

// Action hooks
export const useSendMessage = () => useChatContext(state => state.sendMessage)
export const useAddMessage = () => useChatContext(state => state.addMessage)
export const useClearMessages = () => useChatContext(state => state.clearMessages)
export const useSetChatSandboxClient = () => useChatContext(state => state.setSandboxClient)
export const useSetChatActiveSessionId = () => useChatContext(state => state.setActiveSessionId)
