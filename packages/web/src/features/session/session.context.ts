import { createContext, useContext } from "react"
import { useStore } from "zustand/react"
import type { SessionStoreState, SessionStore, Message } from "./session.store"

export const SessionContext = createContext<SessionStore | null>(null)

export function useSessionContext<T>(selector: (state: SessionStoreState) => T): T {
  const store = useContext(SessionContext)
  if (!store) {
    throw new Error("Missing SessionContext.Provider in the tree")
  }
  return useStore(store, selector)
}

// Stable empty array to avoid creating new references
const EMPTY_MESSAGES: Message[] = []

// Helper selectors
export const useSessions = () => useSessionContext(state => state.sessions)
export const useActiveSessionId = () => useSessionContext(state => state.activeSessionId)
export const useActiveSession = () => useSessionContext(state =>
  state.sessions.find(session => session.id === state.activeSessionId)
)
export const useSessionLoading = () => useSessionContext(state => state.isLoading)
export const useSessionError = () => useSessionContext(state => state.error)
export const useMessages = (sessionId?: string) => useSessionContext(state =>
  sessionId ? (state.messages[sessionId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES
)
export const useMessagesLoading = () => useSessionContext(state => state.isLoadingMessages)

// Action hooks
export const useGetAllSessions = () => useSessionContext(state => state.getAllSessions)
export const useCreateSession = () => useSessionContext(state => state.createSession)
export const useConvertEphemeralToReal = () => useSessionContext(state => state.convertEphemeralToReal)
export const useAddUISession = () => useSessionContext(state => state.addUISession)
export const useUpdateUISession = () => useSessionContext(state => state.updateUISession)
export const useRemoveUISession = () => useSessionContext(state => state.removeUISession)
export const useSetActiveSession = () => useSessionContext(state => state.setActiveSession)
export const useGetMessages = () => useSessionContext(state => state.getMessages)
