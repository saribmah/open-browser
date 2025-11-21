import { createContext, useContext } from "react"
import { useStore } from "zustand/react"
import type { SandboxStoreState, SandboxStore } from "./sandbox.store"

export const SandboxContext = createContext<SandboxStore | null>(null)

export function useSandboxContext<T>(selector: (state: SandboxStoreState) => T): T {
  const store = useContext(SandboxContext)
  if (!store) {
    throw new Error("Missing SandboxContext.Provider in the tree")
  }
  return useStore(store, selector)
}

// Helper selectors
export const useSandboxData = () => useSandboxContext(state => state.sandbox)
export const useSandboxClient = () => useSandboxContext(state => state.sandboxClient)
export const useSandboxStatus = () => useSandboxContext(state => state.status)
export const useSandboxError = () => useSandboxContext(state => state.error)
export const useCreateSandbox = () => useSandboxContext(state => state.createSandbox)
export const useSetSandbox = () => useSandboxContext(state => state.setSandbox)
