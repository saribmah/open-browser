import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { postInstanceInit } from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"

export type SdkType = "OPENCODE" | "CLAUDE_CODE"
export type InstanceStatus = "idle" | "initializing" | "ready" | "error"

export interface InstanceState {
  status: InstanceStatus
  error: string | null
  sdkType: SdkType | null
  initialized: boolean
}

export interface InstanceActions {
  initialize: (sdkType: SdkType, sandboxClient: typeof sandboxClientType) => Promise<void>
  setStatus: (status: InstanceStatus) => void
  setError: (error: string | null) => void
  reset: () => void
}

export type InstanceStoreState = InstanceState & InstanceActions

export const createInstanceStore = () => {
  const initialState: InstanceState = {
    status: "idle",
    error: null,
    sdkType: null,
    initialized: false,
  }

  return create<InstanceStoreState>()(
    devtools(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        initialize: async (sdkType: SdkType, sandboxClient: typeof sandboxClientType) => {
          set({ status: "initializing", error: null, sdkType })

          try {
            // Use the sandboxClient passed from the sandbox context
            const result = await postInstanceInit({
              body: { sdkType },
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to initialize SDK"
              set({ error: errorMsg, status: "error", initialized: false })
              throw new Error(errorMsg)
            }

            set({ status: "ready", initialized: true })
          } catch (err: any) {
            const errorMsg = err.message || "Failed to initialize SDK"
            set({ error: errorMsg, status: "error", initialized: false })
            throw err
          }
        },

        setStatus: (status) => set({ status }),
        setError: (error) => set({ error }),
        reset: () => set(initialState),
      }),
      {
        name: "instance-store",
      }
    )
  )
}

export type InstanceStore = ReturnType<typeof createInstanceStore>
