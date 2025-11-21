import React, { useRef } from "react"
import { ChatContext } from "./chat.context"
import { createChatStore, type ChatStore } from "./chat.store"

type ChatProviderProps = React.PropsWithChildren

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const storeRef = useRef<ChatStore>(createChatStore())

  return (
    <ChatContext.Provider value={storeRef.current}>
      {children}
    </ChatContext.Provider>
  )
}
