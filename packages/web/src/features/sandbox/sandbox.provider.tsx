import { useRef, useEffect, type ReactNode } from "react"
import { useParams } from "react-router"
import { SandboxContext } from "./sandbox.context"
import { createSandboxStore, type SandboxStoreApi, type Sandbox, type SdkType } from "./sandbox.store"
import { InstanceProvider } from "@/features/instance"
import { getSandboxId } from "@/client/api/sdk.gen"
import type { GetSandboxIdResponses } from "@/client/api/types.gen"

interface SandboxProviderProps {
  children: ReactNode
  initialSandbox?: Sandbox
  sdkType?: SdkType
}

export function SandboxProvider({ 
  children, 
  initialSandbox,
  sdkType = "OPENCODE" 
}: SandboxProviderProps) {
  const params = useParams<{ sandboxId?: string }>()
  const sandboxId = params.sandboxId
  const storeRef = useRef<SandboxStoreApi>(createSandboxStore(initialSandbox))

  // Load sandbox if sandboxId is in URL
  useEffect(() => {
    if (!sandboxId) {
      return
    }

    const state = storeRef.current.getState()

    // If we have a sandbox ID from URL but no sandbox loaded, fetch it
    if (!state.sandbox || state.sandbox.id !== sandboxId) {
      const fetchSandbox = async () => {
        try {
          state.setStatus("creating")
          state.setError(null)

          const result = await getSandboxId({
            path: { id: sandboxId }
          })

          if (result.error) {
            state.setError("Failed to load sandbox")
            state.setStatus("error")
            return
          }

          const data = result.data as GetSandboxIdResponses[200]
          if (data) {
            state.setSandbox({
              id: data.id,
              provider: data.provider,
              status: data.status,
              url: data.url,
              createdAt: data.createdAt,
              metadata: data.metadata
            })
          }
        } catch (err: any) {
          state.setError(err.message || "Failed to load sandbox")
          state.setStatus("error")
        }
      }

      fetchSandbox()
    }
  }, [sandboxId])

  return (
    <SandboxContext.Provider value={storeRef.current}>
      <InstanceProvider sdkType={sdkType}>
        {children}
      </InstanceProvider>
    </SandboxContext.Provider>
  )
}
