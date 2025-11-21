import { Daytona, Sandbox as DaytonaSandboxInstance } from '@daytonaio/sdk';
import type { SandboxConfig, SandboxSession, SandboxProviderInterface } from "./manager";

const DAYTONA_IMAGE = "daytonaio/ai-sandbox:latest";
const SERVER_PORT = 3097;

export class DaytonaSandbox implements SandboxProviderInterface {
    private daytona: Daytona;

    constructor() {
        const apiKey = process.env.DAYTONA_API_KEY;
        if (!apiKey) {
            throw new Error('DAYTONA_API_KEY environment variable is not set');
        }
        this.daytona = new Daytona({ apiKey, target: 'us' });
    }

    async create(config: SandboxConfig): Promise<SandboxSession> {
        const id = crypto.randomUUID();
        
        try {
            // Create the Daytona container
            const container = await this.daytona.create({
                snapshot: DAYTONA_IMAGE,
                autoStopInterval: 45,
                autoDeleteInterval: 0,
                public: true,
            });

            // Start the sandbox server binary
            await this.startServer(container);

            // Get preview URL for the server port
            const previewLink = await container.getPreviewLink(SERVER_PORT);
            const serverUrl = previewLink.url;

            // Wait for server to be ready
            await this.waitForServerReady(serverUrl);

            return {
                id: container.id,
                provider: "daytona",
                status: "ready",
                url: serverUrl,
                createdAt: new Date().toISOString(),
                config,
            };
        } catch (error: any) {
            return {
                id,
                provider: "daytona",
                status: "error",
                url: null,
                createdAt: new Date().toISOString(),
                config,
                errorMessage: error.message || "Failed to create Daytona sandbox"
            };
        }
    }

    private async startServer(container: DaytonaSandboxInstance): Promise<void> {
        const sessionId = `server-${container.id}`;
        await container.process.createSession(sessionId);

        // Start the compiled server binary
        await container.process.executeSessionCommand(sessionId, {
            command: `/usr/local/bin/server`,
            runAsync: true,
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

    async stop(sandboxId: string): Promise<void> {
        const sandbox = await this.daytona.get(sandboxId);
        await this.daytona.stop(sandbox);
    }

    async delete(sandboxId: string): Promise<void> {
        const sandbox = await this.daytona.get(sandboxId);
        await this.daytona.stop(sandbox);
        await this.daytona.delete(sandbox);
    }
}
