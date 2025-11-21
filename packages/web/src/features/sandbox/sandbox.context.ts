import { createContext, useContext } from "react"
import { useStore } from "zustand"
import type { SandboxStore, SandboxStoreApi } from "./sandbox.store"

export const SandboxContext = createContext<SandboxStoreApi | null>(null)

export function useSandboxStore<T>(selector: (state: SandboxStore) => T): T {
  const store = useContext(SandboxContext)
  if (!store) {
    throw new Error("useSandboxStore must be used within a SandboxProvider")
  }
  return useStore(store, selector)
}

export function useSandbox() {
  return useSandboxStore((state) => state)
}

export function useSandboxContext() {
  const store = useContext(SandboxContext)
  if (!store) {
    throw new Error("useSandboxContext must be used within a SandboxProvider")
  }
  return store
}

export function useSandboxClient() {
  return useSandboxStore((state) => state.sandboxClient)
}
