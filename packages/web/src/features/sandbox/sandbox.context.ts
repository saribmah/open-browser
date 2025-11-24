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
