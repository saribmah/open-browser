import { createStore } from "zustand/vanilla"
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

export type InstanceStore = InstanceState & InstanceActions

const initialState: InstanceState = {
  status: "idle",
  error: null,
  sdkType: null,
  initialized: false,
}

export function createInstanceStore() {
  return createStore<InstanceStore>((set) => ({
    ...initialState,

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
  }))
}

export type InstanceStoreApi = ReturnType<typeof createInstanceStore>
