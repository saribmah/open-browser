import { Docker } from 'node-docker-api/lib/docker';
import type { SandboxConfig, SandboxSession, SandboxProviderInterface } from "./manager";

const DOCKER_IMAGE = process.env.DOCKER_IMAGE || "open-browser-sandbox:latest";
const SERVER_PORT = 3000;
const FRONTEND_PORT = 5173;

export class DockerSandbox implements SandboxProviderInterface {
    private docker: Docker;

    constructor() {
        // Connect to Docker daemon
        // Uses Unix socket by default
        this.docker = new Docker({
            socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock'
        });
    }

    async create(config: SandboxConfig): Promise<SandboxSession> {
        const id = crypto.randomUUID();

        try {
            // Create Docker container
            const container = await this.docker.container.create({
                Image: DOCKER_IMAGE,
                name: `sandbox-${id}`,
                ExposedPorts: {
                    [`${SERVER_PORT}/tcp`]: {},
                    [`${FRONTEND_PORT}/tcp`]: {},
                },
                HostConfig: {
                    Memory: 1024 * 1024 * 1024, // 1GB
                    CpuShares: 1024, // 1 CPU
                    PublishAllPorts: true,
                    AutoRemove: true,
                    PortBindings: {
                        [`${SERVER_PORT}/tcp`]: [{ HostPort: '0' }], // Dynamic port
                        [`${FRONTEND_PORT}/tcp`]: [{ HostPort: '0' }], // Dynamic port
                    },
                },
                Env: [
                    `SANDBOX_ID=${id}`,
                    `SDK_TYPE=${config.sdkType}`,
                    `PROJECT_TYPE=${config.type}`,
                    `PROJECT_URL=${config.url}`,
                    `PROJECT_DIR=${config.directory}`,
                ],
            });

            // Start the container
            await container.start();

            // Get container status to get port mappings
            const containerStatus = await container.status();
            const ports = (containerStatus.data as any).NetworkSettings.Ports;

            // Get the dynamically assigned host ports
            const serverPortMapping = ports[`${SERVER_PORT}/tcp`];
            if (!serverPortMapping || serverPortMapping.length === 0) {
                throw new Error('Failed to get server port mapping from container');
            }

            const serverPort = serverPortMapping[0].HostPort;
            const serverUrl = `http://127.0.0.1:${serverPort}`;

            // Start the sandbox server inside the container
            await this.startServer(container, config);

            // Wait for server to be ready
            await this.waitForServerReady(serverUrl);

            return {
                id: container.id,
                provider: "docker",
                status: "ready",
                url: serverUrl,
                createdAt: new Date().toISOString(),
                config,
            };
        } catch (error: any) {
            console.log(error);
            return {
                id,
                provider: "docker",
                status: "error",
                url: null,
                createdAt: new Date().toISOString(),
                config,
                errorMessage: error.message || "Failed to create Docker sandbox",
            };
        }
    }

    private async startServer(
        container: any,
        config: SandboxConfig
    ): Promise<void> {
        // Execute the sandbox server command inside the container
        const exec = await container.exec.create({
            Cmd: ['/bin/sh', '-c', '/usr/local/bin/server'],
            AttachStdout: true,
            AttachStderr: true,
            Env: [
                `SDK_TYPE=${config.sdkType}`,
                `PROJECT_TYPE=${config.type}`,
                `PROJECT_URL=${config.url}`,
                `PROJECT_DIR=${config.directory}`,
            ],
        });

        // Start the exec (runs in detached mode)
        await exec.start({ Detach: true });
    }

    private async waitForServerReady(
        url: string,
        maxAttempts = 30
    ): Promise<void> {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const res = await fetch(`${url}/health`);
                if (res.ok) {
                    return;
                }
            } catch {
                // Server not ready yet
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        throw new Error('Server did not become ready in time');
    }

    async stop(sandboxId: string): Promise<void> {
        const container = this.docker.container.get(sandboxId);
        await container.stop();
    }

    async delete(sandboxId: string): Promise<void> {
        const container = this.docker.container.get(sandboxId);
        try {
            await container.stop();
        } catch (error: any) {
            // Container might already be stopped, continue to remove
            console.warn(`Container ${sandboxId} already stopped or error stopping:`, error.message);
        }
        await container.delete({ force: true });
    }
}
