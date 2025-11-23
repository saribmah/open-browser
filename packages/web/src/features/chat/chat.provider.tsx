import React, { useRef, useEffect } from "react"
import { ChatContext } from "./chat.context"
import { createChatStore, type ChatStore } from "./chat.store"
import { useSessionSandboxClient, useActiveSessionId } from "@/features/session"

type ChatProviderProps = React.PropsWithChildren

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const storeRef = useRef<ChatStore>(createChatStore())
  
  // Sync with session store
  const sandboxClient = useSessionSandboxClient()
  const activeSessionId = useActiveSessionId()

  useEffect(() => {
    storeRef.current.getState().setSandboxClient(sandboxClient)
  }, [sandboxClient])

  useEffect(() => {
    if (activeSessionId) {
      storeRef.current.getState().setActiveSessionId(activeSessionId)
    }
  }, [activeSessionId])

  // Initialize event listeners
  useEffect(() => {
    console.log("[Chat Provider] Initializing event listeners")
    const cleanup = storeRef.current.getState().initializeEventListeners()
    
    return () => {
      console.log("[Chat Provider] Cleaning up event listeners")
      cleanup()
    }
  }, [])

  return (
    <ChatContext.Provider value={storeRef.current}>
      {children}
    </ChatContext.Provider>
  )
}
