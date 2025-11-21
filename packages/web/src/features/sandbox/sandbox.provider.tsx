import { useRef, useEffect, type ReactNode } from "react"
import { SandboxContext } from "./sandbox.context"
import { createSandboxStore, type SandboxStore, type Sandbox, type SdkType } from "./sandbox.store"
import { ProjectProvider } from "@/features/project"
import { InstanceProvider } from "@/features/instance"
import { getSandboxId } from "@/client/api/sdk.gen"
import type { GetSandboxIdResponses } from "@/client/api/types.gen"

interface SandboxProviderProps {
  children: ReactNode
  sandboxId?: string
  initialSandbox?: Sandbox
  sdkType?: SdkType
}

export function SandboxProvider({ 
  children,
  sandboxId,
  initialSandbox,
  sdkType = "OPENCODE" 
}: SandboxProviderProps) {
  const storeRef = useRef<SandboxStore>(createSandboxStore(initialSandbox))

  // Load sandbox if sandboxId is in URL
  useEffect(() => {
    if (!sandboxId) {
      return
    }

    const store = storeRef.current
    const state = store.getState()

    // If we have a sandbox ID from URL but no sandbox loaded, fetch it
    if (!state.sandbox || state.sandbox.id !== sandboxId) {
      const fetchSandbox = async () => {
        try {
          store.getState().setStatus("creating")
          store.getState().setError(null)

          const result = await getSandboxId({
            path: { id: sandboxId }
          })

          if (result.error) {
            store.getState().setError("Failed to load sandbox")
            store.getState().setStatus("error")
            return
          }

          const data = result.data as GetSandboxIdResponses[200]
          if (data) {
            store.getState().setSandbox({
              id: data.id,
              provider: data.provider,
              status: data.status,
              url: data.url,
              createdAt: data.createdAt,
              metadata: data.metadata
            })
          }
        } catch (err: any) {
          store.getState().setError(err.message || "Failed to load sandbox")
          store.getState().setStatus("error")
        }
      }

      fetchSandbox()
    }
  }, [sandboxId])

  return (
    <SandboxContext.Provider value={storeRef.current}>
      <InstanceProvider sdkType={sdkType}>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </InstanceProvider>
    </SandboxContext.Provider>
  )
}
