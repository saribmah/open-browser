import React, { useEffect, useRef } from "react"
import { MessageContext } from "./message.context"
import { createMessageStore, type MessageStore } from "./message.store"
import { useSessionSandboxClient } from "@/features/session"

interface MessageProviderProps extends React.PropsWithChildren {
  sessionId: string
}

export const MessageProvider = ({ sessionId, children }: MessageProviderProps) => {
  const sandboxClient = useSessionSandboxClient()
  const storeRef = useRef<MessageStore | null>(null)
  const currentSessionIdRef = useRef<string>(sessionId)
  
  // Create a new store only when sessionId changes
  if (!storeRef.current || currentSessionIdRef.current !== sessionId) {
    console.log(`[Message Provider] Creating store for session: ${sessionId}`)
    storeRef.current = createMessageStore(sessionId)
    currentSessionIdRef.current = sessionId
  }
  
  const store = storeRef.current

  // Set sandbox client and fetch messages when client or store changes
  useEffect(() => {
    if (sandboxClient) {
      console.log(`[Message Provider] Setting sandbox client and fetching messages for session: ${sessionId}`)
      
      // Set the sandbox client first
      store.getState().setSandboxClient(sandboxClient)
      
      // Then fetch messages
      store.getState().getMessages()
    }
  }, [sandboxClient, store, sessionId])

  // Initialize event listeners when store changes
  useEffect(() => {
    console.log(`[Message Provider] Initializing event listeners for session: ${sessionId}`)
    const cleanup = store.getState().initializeEventListeners()
    
    return () => {
      console.log(`[Message Provider] Cleaning up event listeners for session: ${sessionId}`)
      cleanup()
    }
  }, [store, sessionId])

  return (
    <MessageContext.Provider value={store}>
      {children}
    </MessageContext.Provider>
  )
}
