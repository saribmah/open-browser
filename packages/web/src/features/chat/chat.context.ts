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
export const useTabs = () => useChatContext(state => state.tabs)
export const useActiveTabId = () => useChatContext(state => state.activeTabId)
export const useActiveTab = () => useChatContext(state => 
  state.tabs.find(tab => tab.id === state.activeTabId)
)
export const useContexts = () => useChatContext(state => state.contexts)
export const useMessages = () => useChatContext(state => state.messages)
export const useChatLoading = () => useChatContext(state => state.isLoading)
export const useChatError = () => useChatContext(state => state.error)

// Action hooks
export const useAddTab = () => useChatContext(state => state.addTab)
export const useRemoveTab = () => useChatContext(state => state.removeTab)
export const useSetActiveTab = () => useChatContext(state => state.setActiveTab)
export const useUpdateTabSession = () => useChatContext(state => state.updateTabSession)
export const useAddContext = () => useChatContext(state => state.addContext)
export const useRemoveContext = () => useChatContext(state => state.removeContext)
export const useSendMessage = () => useChatContext(state => state.sendMessage)
export const useAddMessage = () => useChatContext(state => state.addMessage)
export const useClearMessages = () => useChatContext(state => state.clearMessages)
