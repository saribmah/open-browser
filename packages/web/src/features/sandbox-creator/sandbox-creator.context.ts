import { createSandboxCreatorStore } from "./sandbox-creator.store"

// Create the global store instance
export const useSandboxCreatorStore = createSandboxCreatorStore()

// State hooks
export const useSandboxUrl = () => useSandboxCreatorStore((state) => state.url)
export const useSandboxIsCreating = () => useSandboxCreatorStore((state) => state.isCreating)
export const useSandboxError = () => useSandboxCreatorStore((state) => state.error)
export const useSandboxCreatedId = () => useSandboxCreatorStore((state) => state.createdSandboxId)
export const useSandboxConfig = () => useSandboxCreatorStore((state) => state.config)
export const useSandboxIsLoadingConfig = () => useSandboxCreatorStore((state) => state.isLoadingConfig)

// Action hooks
export const useSetSandboxUrl = () => useSandboxCreatorStore((state) => state.setUrl)
export const useSetSandboxError = () => useSandboxCreatorStore((state) => state.setError)
export const useLoadSandboxConfig = () => useSandboxCreatorStore((state) => state.loadConfig)
export const useCreateSandbox = () => useSandboxCreatorStore((state) => state.createSandbox)
export const useResetSandboxCreator = () => useSandboxCreatorStore((state) => state.reset)
