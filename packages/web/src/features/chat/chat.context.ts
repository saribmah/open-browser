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

// Action hooks
export const useSendMessage = () => useChatContext(state => state.sendMessage)
export const useClearMessages = () => useChatContext(state => state.clearMessages)
export const useSelectedAgent = () => useChatContext(state => state.selectedAgent)
export const useSetSelectedAgent = () => useChatContext(state => state.setSelectedAgent)
export const useSelectedModel = () => useChatContext(state => state.selectedModel)
export const useSetSelectedModel = () => useChatContext(state => state.setSelectedModel)
