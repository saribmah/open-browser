import { createStore } from "zustand/vanilla"
import { postSandbox } from "@/client/api/sdk.gen"
import { client } from "@/client/api/client.gen"
import { client as sandboxClient } from "@/client/sandbox/client.gen"
import type { PostSandboxResponses, PostSandboxData } from "@/client/api/types.gen"

// Extract types from generated API types
export type Sandbox = NonNullable<PostSandboxResponses[200]["sandbox"]>
export type SandboxProviderType = Sandbox["provider"]
export type IntegrationType = NonNullable<PostSandboxData["body"]>["type"]
export type SdkType = NonNullable<PostSandboxData["body"]>["sdkType"]
export type SandboxStatus = "idle" | "setting-up" | "creating" | "ready" | "error"

export interface CreateSandboxParams {
  url: string
  type: IntegrationType
  directory: string
  sdkType: SdkType
  provider: SandboxProviderType
}

export interface SandboxState {
  sandbox: Sandbox | null
  sandboxClient: typeof sandboxClient | null
  status: SandboxStatus
  error: string | null
}

export interface SandboxActions {
  createSandbox: (params: CreateSandboxParams) => Promise<Sandbox | null>
  setSandbox: (sandbox: Sandbox | null) => void
  setStatus: (status: SandboxStatus) => void
  setError: (error: string | null) => void
  reset: () => void
}

export type SandboxStore = SandboxState & SandboxActions

const initialState: SandboxState = {
  sandbox: null,
  sandboxClient: null,
  status: "idle",
  error: null,
}

// Configure the API client base URL
client.setConfig({
  baseUrl: "/api",
})

export function createSandboxStore(initialSandbox?: Sandbox) {
  // Initialize sandbox client if we have a sandbox URL
  let initialClient: typeof sandboxClient | null = null
  if (initialSandbox?.url) {
    const client = sandboxClient
    client.setConfig({ baseUrl: initialSandbox.url })
    initialClient = client
  }

  return createStore<SandboxStore>((set, get) => ({
    ...initialState,
    sandbox: initialSandbox ?? null,
    sandboxClient: initialClient,
    status: initialSandbox ? "ready" : "idle",

    createSandbox: async (params) => {
      set({ status: "creating", error: null })

      try {
        const result = await postSandbox({
          body: params,
        })

        if (result.error) {
          const errorMsg =
            (result.error as { error?: string })?.error || "Failed to create sandbox"
          set({ error: errorMsg, status: "error" })
          return null
        }

        const data = result.data as PostSandboxResponses[200]
        if (data?.sandbox) {
          // Configure sandbox client with the sandbox URL
          const client = sandboxClient
          client.setConfig({ baseUrl: data.sandbox.url })
          
          set({ 
            sandbox: data.sandbox, 
            sandboxClient: client,
            status: "ready" 
          })
          return data.sandbox
        }

        set({ error: "No sandbox returned", status: "error" })
        return null
      } catch (err: any) {
        set({ error: err.message || "Failed to create sandbox", status: "error" })
        return null
      }
    },

    setSandbox: (sandbox) => {
      if (sandbox?.url) {
        // Configure sandbox client when sandbox is set
        const client = sandboxClient
        client.setConfig({ baseUrl: sandbox.url })
        set({ sandbox, sandboxClient: client, status: "ready" })
      } else {
        set({ sandbox, sandboxClient: null, status: "idle" })
      }
    },
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),
    reset: () => set(initialState),
  }))
}

export type SandboxStoreApi = ReturnType<typeof createSandboxStore>
