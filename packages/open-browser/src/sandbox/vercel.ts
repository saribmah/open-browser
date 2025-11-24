import type { SandboxConfig, SandboxSession, SandboxProviderInterface } from "./manager";

export class VercelSandbox implements SandboxProviderInterface {
    async create(config: SandboxConfig): Promise<SandboxSession> {
        const id = crypto.randomUUID();
        
        // TODO: Implement Vercel sandbox creation
        
        return {
            id,
            provider: "vercel",
            status: "pending",
            url: null,
            createdAt: new Date().toISOString(),
            config,
            errorMessage: "Vercel sandbox creation not yet implemented"
        };
    }
}
