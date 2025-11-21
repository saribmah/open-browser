import { useRef, useEffect, createElement, type ReactNode } from "react"
import { useParams } from "react-router"
import { SandboxContext } from "./sandbox.context"
import { createSandboxStore, type SandboxStoreApi, type Sandbox } from "./sandbox.store"
import { getSandboxId } from "@/client/api/sdk.gen"
import type { GetSandboxIdResponses } from "@/client/api/types.gen"

interface SandboxProviderProps {
  children: ReactNode
  initialSandbox?: Sandbox
}

export function SandboxProvider({ children, initialSandbox }: SandboxProviderProps) {
  const params = useParams<{ sandboxId?: string }>()
  const sandboxId = params.sandboxId
  const storeRef = useRef<SandboxStoreApi | null>(null)

  if (!storeRef.current) {
    storeRef.current = createSandboxStore(initialSandbox)
  }

  useEffect(() => {
    if (sandboxId && storeRef.current) {
      const state = storeRef.current.getState()
      
      // If we have a sandbox ID from URL but no sandbox loaded, fetch it
      if (!state.sandbox || state.sandbox.id !== sandboxId) {
        const fetchSandbox = async () => {
          try {
            state.setStatus("creating")
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
  }, [sandboxId])

  return createElement(
    SandboxContext.Provider,
    { value: storeRef.current },
    children
  )
}
