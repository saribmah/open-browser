import React, { useRef, useEffect } from "react"
import { SessionContext } from "./session.context"
import { createSessionStore, type SessionStore } from "./session.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"
import { useInstanceContext } from "@/features/instance/instance.context"

type SessionProviderProps = React.PropsWithChildren

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const sandboxClient = useSandboxContext(s => s.sandboxClient)
  const instanceInitialized = useInstanceContext(s => s.initialized)
  const storeRef = useRef<SessionStore>(createSessionStore())

  // Inject sandboxClient into the store whenever it changes
  useEffect(() => {
    const store = storeRef.current
    store.getState().setSandboxClient(sandboxClient)
    
    // Fetch all sessions only when both sandboxClient is available AND instance is initialized
    if (sandboxClient && instanceInitialized) {
      store.getState().getAllSessions()
    }
  }, [sandboxClient, instanceInitialized])

  return (
    <SessionContext.Provider value={storeRef.current}>
      {children}
    </SessionContext.Provider>
  )
}
