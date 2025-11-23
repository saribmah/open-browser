import { createContext, useContext } from "react"
import type { MessageStore } from "./message.store"
import type { Message } from "./message.store"

export const MessageContext = createContext<MessageStore | null>(null)

export const useMessageContext = <T,>(selector: (state: ReturnType<MessageStore['getState']>) => T): T => {
  const store = useContext(MessageContext)
  if (!store) {
    throw new Error("useMessageContext must be used within a MessageProvider")
  }
  return store(selector)
}

// Convenience hooks
export const useMessages = () => useMessageContext((state) => state.messages)
export const useMessagesLoading = () => useMessageContext((state) => state.isLoading)
export const useMessagesSending = () => useMessageContext((state) => state.isSending)
export const useMessagesError = () => useMessageContext((state) => state.error)
export const useGetMessages = () => useMessageContext((state) => state.getMessages)
export const useSendMessage = () => useMessageContext((state) => state.sendMessage)
export const useAddMessage = () => useMessageContext((state) => state.addMessage)
export const useUpdateMessage = () => useMessageContext((state) => state.updateMessage)
export const useMessageSessionId = () => useMessageContext((state) => state.sessionId)

export type { Message }
