import { getSandbox, type Sandbox } from '@cloudflare/sandbox';
import type { SandboxConfig, SandboxSession, SandboxProviderInterface } from "./manager";

const SERVER_PORT = 4096;

export class CloudflareSandbox implements SandboxProviderInterface {
    private env: Cloudflare.Env;

    constructor(env: Cloudflare.Env) {
        this.env = env;
    }

    async create(config: SandboxConfig): Promise<SandboxSession> {
        const id = crypto.randomUUID();

        try {
            console.log("CREATING CONTAINER");
            // Create the Cloudflare sandbox using the SDK
            const container = getSandbox(this.env.CLOUDFLARE_SANDBOX, `cf-${id}`, {
                sleepAfter: "45m",
                keepAlive: false,
            });

            console.log("STARTING SERVER");
            // Start the sandbox server binary
            await this.startServer(container);

            console.log("GETTING HOSTNAME");
            // Get the hostname from the environment or use a default
            const hostname = this.getHostname();

            console.log("EXPOSING PORTS");
            // Expose the server port and get the preview URL
            const portInfo = await container.exposePort(SERVER_PORT, {
                name: 'server',
                hostname,
            });
            const serverUrl = portInfo.url;
            console.log("SERVER URL", serverUrl)

            // Wait for server to be ready
            // await this.waitForServerReady(serverUrl);

            return {
                id,
                provider: "cloudflare",
                status: "ready",
                url: serverUrl,
                createdAt: new Date().toISOString(),
                config,
            };
        } catch (error: any) {
            return {
                id,
                provider: "cloudflare",
                status: "error",
                url: null,
                createdAt: new Date().toISOString(),
                config,
                errorMessage: error.message || "Failed to create Cloudflare sandbox"
            };
        }
    }

    private async startServer(container: Sandbox): Promise<void> {
        const sessionId = `server-${crypto.randomUUID()}`;
        await container.createSession({ id: sessionId });

        // Start the compiled server binary
        console.log("STARTING SERVER inside");
        await container.startProcess('/usr/local/bin/server', {
            processId: `server-process-${sessionId}`,
        });
    }

    private async waitForServerReady(url: string, maxAttempts = 30): Promise<void> {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const res = await fetch(`${url}/health`);
                if (res.ok) {
                    return;
                }
            } catch {
                // Server not ready yet
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error("Server did not become ready in time");
    }

    private getHostname(): string {
        // Try to get hostname from environment variable or use a default
        // You may want to customize this based on your deployment setup
        return (this.env as any).HOSTNAME || "sandbox.example.com";
    }

    async stop(sandboxId: string): Promise<void> {
        const sandbox = getSandbox(this.env.CLOUDFLARE_SANDBOX, sandboxId);
        // Cloudflare sandboxes auto-stop based on sleepAfter configuration
        // We can manually trigger cleanup by destroying
        await sandbox.destroy();
    }

    async delete(sandboxId: string): Promise<void> {
        const sandbox = getSandbox(this.env.CLOUDFLARE_SANDBOX, sandboxId);
        await sandbox.destroy();
    }
}
