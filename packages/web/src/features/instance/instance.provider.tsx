import React, { useRef, useEffect } from "react"
import { InstanceContext } from "./instance.context"
import { createInstanceStore, type InstanceStore, type SdkType } from "./instance.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"

type InstanceProviderProps = React.PropsWithChildren<{
  sdkType?: SdkType
}>

export const InstanceProvider = ({ 
  children, 
  sdkType = "OPENCODE" 
}: InstanceProviderProps) => {
  const sandbox = useSandboxContext(s => s.sandbox)
  const sandboxClient = useSandboxContext(s => s.sandboxClient)
  const storeRef = useRef<InstanceStore>(createInstanceStore())
  const initializeRef = useRef(false)

  // Initialize instance when sandbox and sandboxClient are available
  useEffect(() => {
    if (!sandbox || !sandboxClient || initializeRef.current) {
      return
    }

    const store = storeRef.current
    const state = store.getState()
    
    // Skip if already initialized
    if (state.initialized) {
      return
    }

    initializeRef.current = true

    const performInit = async () => {
      try {
        await store.getState().initialize(sdkType, sandboxClient)
      } catch (error) {
        // Error is already handled in the store
        console.error("Instance initialization failed:", error)
      }
    }

    performInit()
  }, [sandbox, sandboxClient, sdkType])

  return (
    <InstanceContext.Provider value={storeRef.current}>
      {children}
    </InstanceContext.Provider>
  )
}
