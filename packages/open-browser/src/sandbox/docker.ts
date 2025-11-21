import type { SandboxConfig, SandboxSession, SandboxProviderInterface } from "./manager";

interface DockerContainerInfo {
    id: string;
    ports: {
        [key: string]: Array<{ HostPort: string; HostIp: string }>;
    };
}

interface DockerContainer {
    id: string;
    start(): Promise<void>;
    stop(): Promise<void>;
    remove(): Promise<void>;
    inspect(): Promise<DockerContainerInfo>;
    exec(options: {
        Cmd: string[];
        AttachStdout: boolean;
        AttachStderr: boolean;
        Env?: string[];
    }): Promise<{ start(): Promise<void> }>;
}

interface Docker {
    createContainer(options: any): Promise<DockerContainer>;
    getContainer(id: string): DockerContainer;
}

const DOCKER_IMAGE = process.env.DOCKER_IMAGE || "open-browser-sandbox:latest";
const SERVER_PORT = 3000;
const FRONTEND_PORT = 5173;

// Simple Docker API client (can be replaced with dockerode if needed)
class SimpleDockerClient implements Docker {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.DOCKER_HOST || "http://localhost:2375";
    }

    async createContainer(options: any): Promise<DockerContainer> {
        const response = await fetch(`${this.baseUrl}/containers/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options),
        });

        if (!response.ok) {
            throw new Error(`Failed to create container: ${response.statusText}`);
        }

        const data = await response.json() as { Id: string };
        return this.getContainer(data.Id);
    }

    getContainer(id: string): DockerContainer {
        return {
            id,
            start: async () => {
                const response = await fetch(`${this.baseUrl}/containers/${id}/start`, {
                    method: "POST",
                });
                if (!response.ok) {
                    throw new Error(`Failed to start container: ${response.statusText}`);
                }
            },
            stop: async () => {
                const response = await fetch(`${this.baseUrl}/containers/${id}/stop`, {
                    method: "POST",
                });
                if (!response.ok && response.status !== 304) {
                    throw new Error(`Failed to stop container: ${response.statusText}`);
                }
            },
            remove: async () => {
                const response = await fetch(`${this.baseUrl}/containers/${id}?force=true`, {
                    method: "DELETE",
                });
                if (!response.ok) {
                    throw new Error(`Failed to remove container: ${response.statusText}`);
                }
            },
            inspect: async () => {
                const response = await fetch(`${this.baseUrl}/containers/${id}/json`);
                if (!response.ok) {
                    throw new Error(`Failed to inspect container: ${response.statusText}`);
                }
                const data = await response.json() as any;
                return {
                    id: data.Id,
                    ports: data.NetworkSettings?.Ports || {},
                };
            },
            exec: async (options) => {
                const response = await fetch(`${this.baseUrl}/containers/${id}/exec`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(options),
                });
                if (!response.ok) {
                    throw new Error(`Failed to create exec: ${response.statusText}`);
                }
                const data = await response.json() as { Id: string };
                return {
                    start: async () => {
                        const startResponse = await fetch(
                            `${this.baseUrl}/exec/${data.Id}/start`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ Detach: true }),
                            }
                        );
                        if (!startResponse.ok) {
                            throw new Error(`Failed to start exec: ${startResponse.statusText}`);
                        }
                    },
                };
            },
        };
    }
}

export class DockerSandbox implements SandboxProviderInterface {
    private docker: Docker;

    constructor() {
        this.docker = new SimpleDockerClient();
    }

    async create(config: SandboxConfig): Promise<SandboxSession> {
        const id = crypto.randomUUID();

        try {
            // Create Docker container
            const container = await this.docker.createContainer({
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
                        [`${SERVER_PORT}/tcp`]: [{ HostPort: "0" }], // Dynamic port
                        [`${FRONTEND_PORT}/tcp`]: [{ HostPort: "0" }], // Dynamic port
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

            // Get container info and port mappings
            const containerInfo = await container.inspect();
            const ports = containerInfo.ports;

            // Get the dynamically assigned host ports
            const serverPortMapping = ports[`${SERVER_PORT}/tcp`]?.[0];

            if (!serverPortMapping) {
                throw new Error("Failed to get server port mapping from container");
            }

            const serverPort = serverPortMapping.HostPort;
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
        container: DockerContainer,
        config: SandboxConfig
    ): Promise<void> {
        // Execute the sandbox server command
        const exec = await container.exec({
            Cmd: ["/bin/sh", "-c", "/usr/local/bin/server"],
            AttachStdout: true,
            AttachStderr: true,
            Env: [
                `SDK_TYPE=${config.sdkType}`,
                `PROJECT_TYPE=${config.type}`,
                `PROJECT_URL=${config.url}`,
                `PROJECT_DIR=${config.directory}`,
            ],
        });

        // Start the exec (runs in background)
        await exec.start();
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
        throw new Error("Server did not become ready in time");
    }

    async stop(sandboxId: string): Promise<void> {
        const container = this.docker.getContainer(sandboxId);
        await container.stop();
    }

    async delete(sandboxId: string): Promise<void> {
        const container = this.docker.getContainer(sandboxId);
        await container.stop();
        await container.remove();
    }
}
