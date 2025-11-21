import type { SandboxConfig, SandboxSession, SandboxProviderInterface } from "./manager";

export class CloudflareSandbox implements SandboxProviderInterface {
    async create(config: SandboxConfig): Promise<SandboxSession> {
        const id = crypto.randomUUID();
        
        // TODO: Implement Cloudflare sandbox creation using @cloudflare/sandbox SDK
        
        return {
            id,
            provider: "cloudflare",
            status: "pending",
            url: null,
            createdAt: new Date().toISOString(),
            config,
            errorMessage: "Cloudflare sandbox creation not yet implemented"
        };
    }
}
