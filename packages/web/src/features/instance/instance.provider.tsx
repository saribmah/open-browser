import React, { useRef, useEffect, useState } from "react"
import { InstanceContext } from "./instance.context"
import { createInstanceStore, type InstanceStore, type SdkType } from "./instance.store"
import { useSandboxContext } from "@/features/sandbox/sandbox.context"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

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
  const [isReady, setIsReady] = useState(false)

  // Initialize instance when sandbox and sandboxClient are available
  useEffect(() => {
    if (!sandbox || !sandboxClient || initializeRef.current) {
      return
    }

    const store = storeRef.current
    const state = store.getState()
    
    // Skip if already initialized
    if (state.initialized) {
      setIsReady(true)
      return
    }

    initializeRef.current = true

    const performInit = async () => {
      try {
        await store.getState().initialize(sdkType, sandboxClient)
        setIsReady(true)
      } catch (error) {
        // Error is already handled in the store
        console.error("Instance initialization failed:", error)
        // Still set ready to true so children can render (they can handle the error state)
        setIsReady(true)
      }
    }

    performInit()
  }, [sandbox, sandboxClient, sdkType])

  // Show loading state while initializing
  if (!isReady) {
    return (
      <InstanceContext.Provider value={storeRef.current}>
        <div className="flex items-center justify-center h-screen">
          <Empty className="w-full border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Spinner className="size-6" />
              </EmptyMedia>
              <EmptyTitle>Initializing instance</EmptyTitle>
              <EmptyDescription>
                Setting up your development environment. This will only take a moment.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </InstanceContext.Provider>
    )
  }

  return (
    <InstanceContext.Provider value={storeRef.current}>
      {children}
    </InstanceContext.Provider>
  )
}
