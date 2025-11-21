import { createStore } from "zustand/vanilla"
import { postSandbox } from "@/client/api/sdk.gen"
import { client } from "@/client/api/client.gen"
import type { PostSandboxResponses } from "@/client/api/types.gen"

export type SandboxProviderType = "cloudflare" | "daytona" | "vercel"
export type IntegrationType = "GITHUB" | "ARXIV"
export type SdkType = "OPENCODE" | "CLAUDE_CODE"
export type SandboxStatus = "idle" | "setting-up" | "creating" | "ready" | "error"

export interface Sandbox {
  id: string
  provider: SandboxProviderType
  status: string
  url?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface CreateSandboxParams {
  url: string
  type: IntegrationType
  directory: string
  sdkType: SdkType
  provider: SandboxProviderType
}

export interface SandboxState {
  sandbox: Sandbox | null
  status: SandboxStatus
  error: string | null
  setupComplete: boolean
  setupSteps: string[]
}

export interface SandboxActions {
  createSandbox: (params: CreateSandboxParams) => Promise<Sandbox | null>
  setSandbox: (sandbox: Sandbox | null) => void
  setStatus: (status: SandboxStatus) => void
  setError: (error: string | null) => void
  setSetupComplete: (complete: boolean) => void
  addSetupStep: (step: string) => void
  reset: () => void
}

export type SandboxStore = SandboxState & SandboxActions

const initialState: SandboxState = {
  sandbox: null,
  status: "idle",
  error: null,
  setupComplete: false,
  setupSteps: [],
}

// Configure the API client base URL
client.setConfig({
  baseUrl: "/api",
})

export function createSandboxStore(initialSandbox?: Sandbox) {
  return createStore<SandboxStore>((set) => ({
    ...initialState,
    sandbox: initialSandbox ?? null,
    status: initialSandbox ? "ready" : "idle",
    setupComplete: initialSandbox ? true : false,
    setupSteps: [],

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
          set({ sandbox: data.sandbox, status: "ready" })
          return data.sandbox
        }

        set({ error: "No sandbox returned", status: "error" })
        return null
      } catch (err: any) {
        set({ error: err.message || "Failed to create sandbox", status: "error" })
        return null
      }
    },

    setSandbox: (sandbox) => set({ sandbox, status: sandbox ? "ready" : "idle" }),
    setStatus: (status) => set({ status }),
    setError: (error) => set({ error }),
    setSetupComplete: (complete) => set({ setupComplete: complete }),
    addSetupStep: (step) => set((state) => ({ setupSteps: [...state.setupSteps, step] })),
    reset: () => set(initialState),
  }))
}

export type SandboxStoreApi = ReturnType<typeof createSandboxStore>
