import { createContext, useContext } from "react"
import { useStore } from "zustand"
import type { InstanceStore, InstanceStoreApi } from "./instance.store"

export const InstanceContext = createContext<InstanceStoreApi | null>(null)

export function useInstanceStore<T>(selector: (state: InstanceStore) => T): T {
  const store = useContext(InstanceContext)
  if (!store) {
    throw new Error("useInstanceStore must be used within an InstanceProvider")
  }
  return useStore(store, selector)
}

export function useInstance() {
  return useInstanceStore((state) => state)
}

export function useInstanceContext() {
  const store = useContext(InstanceContext)
  if (!store) {
    throw new Error("useInstanceContext must be used within an InstanceProvider")
  }
  return store
}
