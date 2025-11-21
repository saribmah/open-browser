import type { SandboxConfig, SandboxSession, SandboxProviderInterface } from "./manager";

const LOCAL_SERVER_URL = process.env.LOCAL_SANDBOX_URL || "http://localhost:3097";

export class LocalSandbox implements SandboxProviderInterface {
    async create(config: SandboxConfig): Promise<SandboxSession> {
        const id = crypto.randomUUID();

        try {
            // Check if the local server is running
            const healthCheck = await fetch(`${LOCAL_SERVER_URL}/health`, {
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (!healthCheck.ok) {
                throw new Error(`Local server returned status ${healthCheck.status}`);
            }

            return {
                id,
                provider: "local",
                status: "ready",
                url: LOCAL_SERVER_URL,
                createdAt: new Date().toISOString(),
                config,
            };
        } catch (error: any) {
            return {
                id,
                provider: "local",
                status: "error",
                url: null,
                createdAt: new Date().toISOString(),
                config,
                errorMessage: error.message || `Failed to connect to local sandbox at ${LOCAL_SERVER_URL}. Make sure to run 'bun run dev' in the packages/sandbox directory.`
            };
        }
    }
}
