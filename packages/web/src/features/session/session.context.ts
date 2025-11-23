import { createContext, useContext } from "react"
import { useStore } from "zustand/react"
import type { SessionStoreState, SessionStore, UISession } from "./session.store"

export const SessionContext = createContext<SessionStore | null>(null)

export function useSessionContext<T>(selector: (state: SessionStoreState) => T): T {
  const store = useContext(SessionContext)
  if (!store) {
    throw new Error("Missing SessionContext.Provider in the tree")
  }
  return useStore(store, selector)
}

// Custom equality function that compares session arrays by their IDs and titles
function areVisibleSessionsEqual(a: UISession[], b: UISession[]): boolean {
  if (a.length !== b.length) return false
  return a.every((session, index) => {
    const bSession = b[index]
    return bSession && session.id === bSession.id && session.title === bSession.title
  })
}

// Cached visible sessions result
let lastVisibleSessions: UISession[] = []
let lastState: { visibleSessionIds: string[]; sessions: UISession[] } | null = null

// Helper selectors
export const useSessions = () => useSessionContext(state => state.sessions)
export const useVisibleSessionIds = () => useSessionContext(state => state.visibleSessionIds)

// Get visible sessions with proper caching to prevent infinite loops
export const useVisibleSessions = (): UISession[] => {
  return useSessionContext(state => {
    // Check if we can return cached result
    if (
      lastState &&
      lastState.visibleSessionIds === state.visibleSessionIds &&
      lastState.sessions === state.sessions
    ) {
      return lastVisibleSessions
    }
    
    // Compute new result
    const newVisibleSessions = state.visibleSessionIds
      .map(id => state.sessions.find(s => s.id === id))
      .filter((s): s is UISession => s !== undefined)
    
    // Cache if the visible sessions haven't actually changed
    if (areVisibleSessionsEqual(lastVisibleSessions, newVisibleSessions)) {
      lastState = { visibleSessionIds: state.visibleSessionIds, sessions: state.sessions }
      return lastVisibleSessions
    }
    
    // Update cache with new result
    lastVisibleSessions = newVisibleSessions
    lastState = { visibleSessionIds: state.visibleSessionIds, sessions: state.sessions }
    
    return newVisibleSessions
  })
}

export const useActiveSessionId = () => useSessionContext(state => state.activeSessionId)
export const useActiveSession = () => useSessionContext(state =>
  state.sessions.find(session => session.id === state.activeSessionId)
)
export const useSessionLoading = () => useSessionContext(state => state.isLoading)
export const useSessionError = () => useSessionContext(state => state.error)
export const useSessionSandboxClient = () => useSessionContext(state => state.sandboxClient)

// Action hooks
export const useGetAllSessions = () => useSessionContext(state => state.getAllSessions)
export const useCreateSession = () => useSessionContext(state => state.createSession)
export const useConvertEphemeralToReal = () => useSessionContext(state => state.convertEphemeralToReal)
export const useAddUISession = () => useSessionContext(state => state.addUISession)
export const useUpdateUISession = () => useSessionContext(state => state.updateUISession)
export const useRemoveUISession = () => useSessionContext(state => state.removeUISession)
export const useSetActiveSession = () => useSessionContext(state => state.setActiveSession)
