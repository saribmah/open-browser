import { postInstanceInit } from "@/client/sandbox/sdk.gen"
import { client as sandboxClient } from "@/client/sandbox/client.gen"
import type { SdkType } from "./sandbox.store"

// Configure the sandbox client base URL
sandboxClient.setConfig({
  baseUrl: import.meta.env.VITE_SANDBOX_URL || "http://localhost:3000",
})

export interface SetupStep {
  name: string
  execute: () => Promise<void>
}

export interface SetupResult {
  success: boolean
  completedSteps: string[]
  error?: string
  failedStep?: string
}

/**
 * Initialize the sandbox SDK
 */
async function initializeSDK(sdkType: SdkType): Promise<void> {
  const result = await postInstanceInit({
    body: { sdkType },
  })

  if (result.error) {
    throw new Error(
      (result.error as { error?: string })?.error || "Failed to initialize SDK"
    )
  }
}

/**
 * Setup steps to run before sandbox is ready
 * These run in sequence, and can be extended in the future
 */
export function createSetupSteps(sdkType: SdkType): SetupStep[] {
  return [
    {
      name: "Initialize SDK",
      execute: async () => {
        await initializeSDK(sdkType)
      },
    },
    // Add more setup steps here in the future:
    // {
    //   name: "Load user preferences",
    //   execute: async () => { ... }
    // },
    // {
    //   name: "Sync workspace",
    //   execute: async () => { ... }
    // },
  ]
}

/**
 * Run all setup steps in sequence
 */
export async function runSetup(sdkType: SdkType): Promise<SetupResult> {
  const steps = createSetupSteps(sdkType)
  const completedSteps: string[] = []

  for (const step of steps) {
    try {
      await step.execute()
      completedSteps.push(step.name)
    } catch (error: any) {
      return {
        success: false,
        completedSteps,
        error: error.message || `Failed at step: ${step.name}`,
        failedStep: step.name,
      }
    }
  }

  return {
    success: true,
    completedSteps,
  }
}
