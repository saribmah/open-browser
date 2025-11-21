import React, { useRef, useEffect } from "react"
import { InstanceContext } from "./instance.context"
import { createInstanceStore, type InstanceStoreApi, type SdkType } from "./instance.store"
import { useSandboxStore } from "@/features/sandbox/sandbox.context"

type InstanceProviderProps = React.PropsWithChildren<{
  sdkType?: SdkType
}>

export const InstanceProvider = ({ 
  children, 
  sdkType = "OPENCODE" 
}: InstanceProviderProps) => {
  const sandbox = useSandboxStore(s => s.sandbox)
  const sandboxClient = useSandboxStore(s => s.sandboxClient)
  const storeRef = useRef<InstanceStoreApi>(createInstanceStore())
  const initializeRef = useRef(false)

  // Initialize instance when sandbox and sandboxClient are available
  useEffect(() => {
    if (!sandbox || !sandboxClient || initializeRef.current) {
      return
    }

    const state = storeRef.current.getState()
    
    // Skip if already initialized
    if (state.initialized) {
      return
    }

    initializeRef.current = true

    const performInit = async () => {
      try {
        await state.initialize(sdkType, sandboxClient)
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
