import type { SandboxConfig, SandboxSession, SandboxProviderInterface } from "./manager";

export class DaytonaSandbox implements SandboxProviderInterface {
    async create(config: SandboxConfig): Promise<SandboxSession> {
        const id = crypto.randomUUID();
        
        // TODO: Implement Daytona sandbox creation
        
        return {
            id,
            provider: "daytona",
            status: "pending",
            url: null,
            createdAt: new Date().toISOString(),
            config,
            errorMessage: "Daytona sandbox creation not yet implemented"
        };
    }
}
