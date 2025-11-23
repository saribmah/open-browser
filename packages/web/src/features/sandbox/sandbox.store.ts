import { create } from "zustand"
import { devtools } from "zustand/middleware"
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

export interface SandboxState {
  sandbox: Sandbox | null
  sandboxClient: typeof sandboxClient | null
  status: SandboxStatus
  error: string | null
}

export interface SandboxActions {
  setSandbox: (sandbox: Sandbox | null) => void
  setStatus: (status: SandboxStatus) => void
  setError: (error: string | null) => void
  reset: () => void
}

export type SandboxStoreState = SandboxState & SandboxActions

// Configure the API client base URL
const baseUrl = import.meta.env?.VITE_API_URL || "http://localhost:8787/api"
client.setConfig({baseUrl})

export const createSandboxStore = (initialSandbox?: Sandbox) => {
  // Initialize sandbox client if we have a sandbox URL
  let initialClient: typeof sandboxClient | null = null
  if (initialSandbox?.url) {
    const client = sandboxClient
    client.setConfig({ baseUrl: initialSandbox.url })
    initialClient = client
  }

  const initialState: SandboxState = {
    sandbox: initialSandbox ?? null,
    sandboxClient: initialClient,
    status: initialSandbox ? "ready" : "idle",
    error: null,
  }

  return create<SandboxStoreState>()(
    devtools(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
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
      }),
      {
        name: "sandbox-store",
      }
    )
  )
}

export type SandboxStore = ReturnType<typeof createSandboxStore>
