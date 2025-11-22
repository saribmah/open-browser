import React, { useRef, useEffect } from "react"
import { SessionContext } from "./session.context"
import { createSessionStore, type SessionStore } from "./session.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"

type SessionProviderProps = React.PropsWithChildren

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const sandboxClient = useSandboxContext(s => s.sandboxClient)
  const storeRef = useRef<SessionStore>(createSessionStore())

  // Inject sandboxClient into the store whenever it changes
  useEffect(() => {
    const store = storeRef.current
    store.getState().setSandboxClient(sandboxClient)
    
    // Fetch all sessions when sandboxClient is available
    if (sandboxClient) {
      store.getState().getAllSessions()
    }
  }, [sandboxClient])

  return (
    <SessionContext.Provider value={storeRef.current}>
      {children}
    </SessionContext.Provider>
  )
}
