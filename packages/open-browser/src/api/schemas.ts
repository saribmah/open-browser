import { z } from "zod";

// Provider types
export const SandboxProviderSchema = z.enum(["cloudflare", "daytona", "vercel", "docker"]);
export type SandboxProvider = z.infer<typeof SandboxProviderSchema>;

// Integration types
export const IntegrationTypeSchema = z.enum(["GITHUB", "ARXIV"]);
export type IntegrationType = z.infer<typeof IntegrationTypeSchema>;

// SDK types
export const SdkTypeSchema = z.enum(["OPENCODE", "CLAUDE_CODE"]);
export type SdkType = z.infer<typeof SdkTypeSchema>;

// Status types
export const SandboxStatusSchema = z.enum(["pending", "running", "stopped", "error"]);
export type SandboxStatus = z.infer<typeof SandboxStatusSchema>;

// Sandbox schema
export const SandboxSchema = z.object({
    id: z.string(),
    provider: SandboxProviderSchema,
    status: SandboxStatusSchema,
    url: z.string().optional(),
    createdAt: z.string(),
    metadata: z.record(z.string(), z.any()).optional()
});
export type Sandbox = z.infer<typeof SandboxSchema>;

// Create sandbox request schema
export const CreateSandboxSchema = z.object({
    url: z.string(),
    type: IntegrationTypeSchema,
    directory: z.string(),
    sdkType: SdkTypeSchema,
    provider: SandboxProviderSchema
});
export type CreateSandbox = z.infer<typeof CreateSandboxSchema>;

// Response schemas
export const ErrorSchema = z.object({
    error: z.string()
});

export const SandboxesResponseSchema = z.object({
    sandboxes: z.array(SandboxSchema)
});

export const SuccessSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    sandbox: SandboxSchema.optional()
});
