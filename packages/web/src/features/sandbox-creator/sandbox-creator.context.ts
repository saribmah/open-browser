import { createSandboxCreatorStore } from "./sandbox-creator.store"

// Create the global store instance
export const useSandboxCreatorStore = createSandboxCreatorStore()

// State hooks
export const useSandboxUrl = () => useSandboxCreatorStore((state) => state.url)
export const useSandboxIsCreating = () => useSandboxCreatorStore((state) => state.isCreating)
export const useSandboxError = () => useSandboxCreatorStore((state) => state.error)
export const useSandboxCreatedId = () => useSandboxCreatorStore((state) => state.createdSandboxId)

// Action hooks
export const useSetSandboxUrl = () => useSandboxCreatorStore((state) => state.setUrl)
export const useSetSandboxError = () => useSandboxCreatorStore((state) => state.setError)
export const useCreateSandbox = () => useSandboxCreatorStore((state) => state.createSandbox)
export const useResetSandboxCreator = () => useSandboxCreatorStore((state) => state.reset)
