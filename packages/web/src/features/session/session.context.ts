import { createContext, useContext } from "react"
import { useStore } from "zustand/react"
import type { SessionStoreState, SessionStore } from "./session.store"

export const SessionContext = createContext<SessionStore | null>(null)

export function useSessionContext<T>(selector: (state: SessionStoreState) => T): T {
  const store = useContext(SessionContext)
  if (!store) {
    throw new Error("Missing SessionContext.Provider in the tree")
  }
  return useStore(store, selector)
}

// Helper selectors
export const useSessions = () => useSessionContext(state => state.sessions)
export const useSessionLoading = () => useSessionContext(state => state.isLoading)
export const useSessionError = () => useSessionContext(state => state.error)

// Action hooks
export const useGetAllSessions = () => useSessionContext(state => state.getAllSessions)
export const useCreateSession = () => useSessionContext(state => state.createSession)
