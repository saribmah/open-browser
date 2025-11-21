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

// Helper selectors
export const useInstanceStatus = () => useInstanceContext(state => state.status)
export const useInstanceError = () => useInstanceContext(state => state.error)
export const useInstanceInitialized = () => useInstanceContext(state => state.initialized)
export const useInstanceSdkType = () => useInstanceContext(state => state.sdkType)
export const useInitializeInstance = () => useInstanceContext(state => state.initialize)
