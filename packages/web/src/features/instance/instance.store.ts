import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { postInstanceInit, getConfigProviders, getSdkConfig } from "@/client/sandbox/sdk.gen"
import type { client as sandboxClientType } from "@/client/sandbox/client.gen"
import type { PostInstanceInitData, GetConfigProvidersResponses, GetSdkConfigResponses } from "@/client/sandbox/types.gen"

// Use generated types from the API
export type SdkType = NonNullable<PostInstanceInitData['body']>['sdkType']
export type InstanceStatus = "idle" | "initializing" | "ready" | "error"
export type ProvidersData = GetConfigProvidersResponses[200]
export type SdkConfigData = GetSdkConfigResponses[200]

export interface InstanceState {
  status: InstanceStatus
  error: string | null
  sdkType: SdkType | null
  initialized: boolean
  providers: ProvidersData | null
  sdkConfig: SdkConfigData | null
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
    providers: null,
    sdkConfig: null,
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
            // Initialize the SDK instance
            const result = await postInstanceInit({
              body: { sdkType },
              client: sandboxClient,
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to initialize SDK"
              set({ error: errorMsg, status: "error", initialized: false })
              throw new Error(errorMsg)
            }

            // Fetch providers config
            const providersResult = await getConfigProviders({
              client: sandboxClient,
            })

            if (providersResult.error) {
              console.warn("Failed to fetch providers:", providersResult.error)
            }

            // Fetch SDK config
            const sdkConfigResult = await getSdkConfig({
              client: sandboxClient,
            })

            if (sdkConfigResult.error) {
              console.warn("Failed to fetch SDK config:", sdkConfigResult.error)
            }

            set({ 
              status: "ready", 
              initialized: true,
              providers: providersResult.data || null,
              sdkConfig: sdkConfigResult.data || null,
            })
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
