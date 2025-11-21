import { useRef, useEffect, createElement, type ReactNode } from "react"
import { useParams } from "react-router"
import { SandboxContext } from "./sandbox.context"
import { createSandboxStore, type SandboxStoreApi, type Sandbox } from "./sandbox.store"
import { runSetup } from "./sandbox.setup"
import { getSandboxId } from "@/client/api/sdk.gen"
import type { GetSandboxIdResponses } from "@/client/api/types.gen"

interface SandboxProviderProps {
  children: ReactNode
  initialSandbox?: Sandbox
  sdkType?: "OPENCODE" | "CLAUDE_CODE"
}

export function SandboxProvider({ 
  children, 
  initialSandbox,
  sdkType = "OPENCODE" 
}: SandboxProviderProps) {
  const params = useParams<{ sandboxId?: string }>()
  const sandboxId = params.sandboxId
  const storeRef = useRef<SandboxStoreApi | null>(null)
  const setupInitiated = useRef(false)

  if (!storeRef.current) {
    storeRef.current = createSandboxStore(initialSandbox)
  }

  // Run setup once when provider mounts and sandboxId is present
  useEffect(() => {
    // Only run setup if we have a sandboxId (meaning we're in chat page)
    if (!sandboxId) {
      return
    }

    if (!setupInitiated.current && storeRef.current) {
      setupInitiated.current = true
      const state = storeRef.current.getState()

      // Skip setup if sandbox already initialized
      if (state.setupComplete) {
        return
      }

      const performSetup = async () => {
        try {
          state.setStatus("setting-up")
          state.setError(null)

          const result = await runSetup(sdkType)

          if (!result.success) {
            state.setError(result.error || "Setup failed")
            state.setStatus("error")
            return
          }

          // Mark all completed steps
          result.completedSteps.forEach((step) => {
            state.addSetupStep(step)
          })

          state.setSetupComplete(true)
          state.setStatus("idle")
        } catch (err: any) {
          state.setError(err.message || "Setup failed")
          state.setStatus("error")
        }
      }

      performSetup()
    }
  }, [sdkType, sandboxId])

  // Load sandbox if sandboxId is in URL
  useEffect(() => {
    if (sandboxId && storeRef.current) {
      const state = storeRef.current.getState()
      
      // Wait for setup to complete first
      if (!state.setupComplete) {
        return
      }

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
    }
  }, [sandboxId, storeRef.current?.getState().setupComplete])

  return createElement(
    SandboxContext.Provider,
    { value: storeRef.current },
    children
  )
}
