import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { postSandbox, getConfig } from "@/client/api/sdk.gen"
import type { PostSandboxResponses, GetConfigResponses } from "@/client/api/types.gen"

// Note: API client is configured in sandbox.store.ts with base URL

// Types for URL parsing
export type SandboxType = 'GITHUB' | 'ARXIV'

export interface ParsedUrl {
  type: SandboxType
  directory: string
}

// Utility function to parse URLs
export function parseUrl(url: string): ParsedUrl | null {
  if (url.includes('github.com')) {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match && match[2]) {
      return { type: 'GITHUB', directory: match[2] }
    }
  }
  if (url.includes('arxiv.org')) {
    const match = url.match(/arxiv\.org\/abs\/([^/]+)/)
    if (match && match[1]) {
      return { type: 'ARXIV', directory: match[1] }
    }
  }
  return null
}

// Config types
export interface ProviderConfig {
  name: string
  version: string
  sdks: string[]
  defaultSdk: string
}

export interface AppConfig {
  providers: ProviderConfig[]
  defaultProvider: string
}

// Store state
export interface SandboxCreatorState {
  url: string
  isCreating: boolean
  error: string | null
  createdSandboxId: string | null
  config: AppConfig | null
  isLoadingConfig: boolean
}

// Store actions
export interface SandboxCreatorActions {
  setUrl: (url: string) => void
  setError: (error: string | null) => void
  loadConfig: () => Promise<void>
  createSandbox: (url: string, provider?: string, sdkType?: string) => Promise<{ success: boolean; sandboxId?: string }>
  reset: () => void
}

export type SandboxCreatorStoreState = SandboxCreatorState & SandboxCreatorActions

export const createSandboxCreatorStore = () => {
  const initialState: SandboxCreatorState = {
    url: "",
    isCreating: false,
    error: null,
    createdSandboxId: null,
    config: null,
    isLoadingConfig: false,
  }

  return create<SandboxCreatorStoreState>()(
    devtools(
      (set) => ({
        // Initial state
        ...initialState,

        // Actions
        setUrl: (url: string) => {
          set({ url, error: null })
        },

        setError: (error: string | null) => {
          set({ error })
        },

        loadConfig: async () => {
          set({ isLoadingConfig: true })
          try {
            const result = await getConfig()
            
            if (result.error) {
              console.error("Failed to load config:", result.error)
              set({ isLoadingConfig: false })
              return
            }

            const data = result.data as GetConfigResponses[200]
            if (data) {
              const config: AppConfig = {
                providers: data.providers.map(p => ({
                  name: p.name,
                  version: p.version,
                  sdks: [...p.sdks],
                  defaultSdk: p.defaultSdk
                })),
                defaultProvider: data.defaultProvider
              }
              set({ config, isLoadingConfig: false })
            }
          } catch (err: any) {
            console.error("Failed to load config:", err)
            set({ isLoadingConfig: false })
          }
        },

        createSandbox: async (url: string, provider?: string, sdkType?: string) => {
          const parsed = parseUrl(url)
          
          if (!parsed) {
            set({ error: "Invalid URL. Please enter a valid GitHub or arXiv URL." })
            return { success: false }
          }

          set({ isCreating: true, error: null })

          try {
            // Get config or use defaults
            const currentConfig = (set as any).getState?.()?.config
            const defaultProvider = provider || currentConfig?.defaultProvider || 'local'
            const defaultSdk = sdkType || currentConfig?.providers?.find((p: ProviderConfig) => p.name === defaultProvider)?.defaultSdk || 'OPENCODE'

            const result = await postSandbox({
              body: {
                url,
                type: parsed.type,
                directory: parsed.directory,
                sdkType: defaultSdk as any,
                provider: defaultProvider as any,
              }
            })

            if (result.error) {
              const errorMsg = (result.error as { error?: string })?.error || "Failed to create sandbox"
              set({ error: errorMsg, isCreating: false })
              return { success: false }
            }

            const data = result.data as PostSandboxResponses[200]
            if (data?.sandbox) {
              set({ 
                isCreating: false, 
                createdSandboxId: data.sandbox.id,
                error: null 
              })
              return { success: true, sandboxId: data.sandbox.id }
            } else {
              set({ error: "No sandbox returned", isCreating: false })
              return { success: false }
            }
          } catch (err: any) {
            set({
              error: err.message || "Failed to create sandbox",
              isCreating: false,
            })
            return { success: false }
          }
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: "sandbox-creator-store",
      }
    )
  )
}

export type SandboxCreatorStore = ReturnType<typeof createSandboxCreatorStore>
