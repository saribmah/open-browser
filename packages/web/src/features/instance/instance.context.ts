import { createContext, useContext } from "react"
import { useStore } from "zustand/react"
import type { InstanceStoreState, InstanceStore } from "./instance.store"

export const InstanceContext = createContext<InstanceStore | null>(null)

export function useInstanceContext<T>(selector: (state: InstanceStoreState) => T): T {
  const store = useContext(InstanceContext)
  if (!store) {
    throw new Error("Missing InstanceContext.Provider in the tree")
  }
  return useStore(store, selector)
}
