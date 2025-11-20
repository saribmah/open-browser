import { Log } from "../util/log";
import { Integration } from "../integration/integration";
import { SDK } from "../sdk/sdk";
import path from "path";

const log = Log.create({ service: "instance" });

// Base directory for all instances - from env or current working directory
const WORKSPACE_DIR = process.env["WORKSPACE_DIR"] || process.cwd();

export namespace Instance {

    export interface State {
        id: string;
        type: Integration.Type;
        url: string;
        directory: string;
        sdkType: SDK.Type;
        metadata?: Record<string, any>;
    }

    let currentInstance: State | null = null;
    const availableInstances: State[] = [];

    /**
     * Validate instance type
     */
    function validateType(type: string): type is Integration.Type {
        return Integration.isValidType(type);
    }

    /**
     * Validate SDK type
     */
    function validateSDKType(type: string): type is SDK.Type {
        return SDK.isValidType(type);
    }

    /**
     * Initialize the instance state when server boots up
     */
    export async function init(opts: {
        url: string;
        type: Integration.Type;
        directory: string;
        sdkType: SDK.Type;
    }) {
        // Construct full directory path using WORKSPACE_DIR
        const fullDirectory = path.join(WORKSPACE_DIR, opts.directory);

        log.info("Initializing instance state", {
            url: opts.url,
            type: opts.type,
            directory: opts.directory,
            fullDirectory,
            baseDir: WORKSPACE_DIR,
            sdkType: opts.sdkType
        });

        // Validate integration type
        if (!validateType(opts.type)) {
            const supported = Integration.getSupportedTypes().join(", ");
            throw new Error(`Invalid instance type: ${opts.type}. Must be one of: ${supported}`);
        }

        // Validate SDK type
        if (!validateSDKType(opts.sdkType)) {
            const supported = SDK.getSupportedTypes().join(", ");
            throw new Error(`Invalid SDK type: ${opts.sdkType}. Must be one of: ${supported}`);
        }

        // Create instance from URL and type
        const instance = createInstanceFromUrl(opts.url, opts.type, fullDirectory, opts.sdkType);

        // Setup the integration
        log.info("Setting up instance", {
            instanceId: instance.id,
            directory: fullDirectory
        });

        await Integration.setup({
            url: instance.url,
            type: instance.type,
            directory: fullDirectory,
            metadata: instance.metadata
        });

        // Setup the SDK
        log.info("Setting up SDK", {
            sdkType: opts.sdkType,
            directory: fullDirectory
        });

        await SDK.setup({
            type: opts.sdkType,
            directory: fullDirectory,
            metadata: instance.metadata
        });

        currentInstance = instance;
        log.info("Current instance initialized and setup completed", {
            instance: currentInstance,
            directory: fullDirectory
        });
    }

    /**
     * Create an instance from a URL and type
     */
    function createInstanceFromUrl(url: string, type: Integration.Type, directory: string, sdkType: SDK.Type): State {
        const parsed = Integration.parseUrl(url, type);

        return {
            id: parsed.id,
            type,
            url,
            directory,
            sdkType,
            metadata: parsed.metadata
        };
    }

    /**
     * Get the current active instance
     */
    export function getCurrent(): State | null {
        return currentInstance;
    }

    /**
     * Get all available instances (excluding current)
     */
    export function getAvailable(): State[] {
        if (!currentInstance) {
            return availableInstances;
        }
        const currentId = currentInstance.id;
        return availableInstances.filter(i => i.id !== currentId);
    }

    /**
     * Get all instances including current
     */
    export function getAll(): State[] {
        const all: State[] = [];
        if (currentInstance) {
            all.push(currentInstance);
        }
        const currentId = currentInstance?.id;
        all.push(...availableInstances.filter(i =>
            !currentId || i.id !== currentId
        ));
        return all;
    }

    /**
     * Switch to a different instance
     */
    export function switchTo(instanceId: string): { success: boolean; error?: string; instance?: State } {
        log.info("Attempting to switch instance", { targetId: instanceId });

        // Check if trying to switch to current instance
        if (currentInstance && currentInstance.id === instanceId) {
            return {
                success: false,
                error: "Already on this instance"
            };
        }

        // Find the target instance
        const targetInstance = availableInstances.find(i => i.id === instanceId);

        if (!targetInstance) {
            log.warn("Instance not found", { instanceId });
            return {
                success: false,
                error: "Instance not found"
            };
        }

        // If there was a current instance, add it back to available
        if (currentInstance) {
            const prevInstance = currentInstance;
            const existingIndex = availableInstances.findIndex(i => i.id === prevInstance.id);
            if (existingIndex === -1) {
                availableInstances.push(prevInstance);
            }
        }

        // Set the new current instance
        currentInstance = targetInstance;

        log.info("Instance switched successfully", {
            newInstance: currentInstance.id
        });

        return {
            success: true,
            instance: currentInstance
        };
    }

    /**
     * Add a new instance to available instances
     */
    export async function add(opts: { url: string; type: Integration.Type; directory: string; sdkType: SDK.Type }) {
        // Construct full directory path using WORKSPACE_DIR
        const fullDirectory = path.join(WORKSPACE_DIR, opts.directory);

        log.info("Adding instance", {
            url: opts.url,
            type: opts.type,
            directory: opts.directory,
            fullDirectory,
            baseDir: WORKSPACE_DIR,
            sdkType: opts.sdkType
        });

        // Validate integration type
        if (!validateType(opts.type)) {
            const supported = Integration.getSupportedTypes().join(", ");
            throw new Error(`Invalid instance type: ${opts.type}. Must be one of: ${supported}`);
        }

        // Validate SDK type
        if (!validateSDKType(opts.sdkType)) {
            const supported = SDK.getSupportedTypes().join(", ");
            throw new Error(`Invalid SDK type: ${opts.sdkType}. Must be one of: ${supported}`);
        }

        const instance = createInstanceFromUrl(opts.url, opts.type, fullDirectory, opts.sdkType);
        const exists = availableInstances.find(i => i.id === instance.id);
        if (!exists) {
            // Setup the integration
            log.info("Setting up instance", {
                instanceId: instance.id,
                directory: fullDirectory
            });

            await Integration.setup({
                url: instance.url,
                type: instance.type,
                directory: fullDirectory,
                metadata: instance.metadata
            });

            // Setup the SDK
            log.info("Setting up SDK", {
                sdkType: opts.sdkType,
                directory: fullDirectory
            });

            await SDK.setup({
                type: opts.sdkType,
                directory: fullDirectory,
                metadata: instance.metadata
            });

            availableInstances.push(instance);
            log.info("Instance added and setup completed", {
                instanceId: instance.id,
                directory: fullDirectory
            });
        }
    }

    /**
     * Remove an instance from available instances
     */
    export async function remove(instanceId: string): Promise<{ success: boolean; error?: string }> {
        log.info("Attempting to remove instance", { instanceId });

        // Check if trying to remove current instance
        if (currentInstance && currentInstance.id === instanceId) {
            return {
                success: false,
                error: "Cannot remove the current active instance"
            };
        }

        const instance = availableInstances.find(i => i.id === instanceId);
        if (!instance) {
            log.warn("Instance not found", { instanceId });
            return {
                success: false,
                error: "Instance not found"
            };
        }

        try {
            // Remove SDK
            await SDK.remove({
                type: instance.sdkType,
                directory: instance.directory,
                metadata: instance.metadata
            });

            // Remove integration
            await Integration.remove({
                type: instance.type,
                directory: instance.directory,
                metadata: instance.metadata
            });

            // Remove from available instances
            const index = availableInstances.findIndex(i => i.id === instanceId);
            if (index !== -1) {
                availableInstances.splice(index, 1);
            }

            log.info("Instance removed successfully", {
                instanceId,
                directory: instance.directory
            });

            return { success: true };
        } catch (error: any) {
            log.error("Failed to remove instance", {
                error: error.message,
                instanceId,
                directory: instance.directory
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cleanup all instances - called during process shutdown
     */
    export async function cleanup(): Promise<void> {
        log.info("Starting instance cleanup", {
            currentInstance: currentInstance?.id,
            availableInstancesCount: availableInstances.length
        });

        // Get all instances before cleanup
        const allInstances = getAll();

        if (allInstances.length === 0) {
            log.info("No instances to cleanup");
            return;
        }

        // Clean up available instances first (remove() only works on available instances)
        const availableCleanupPromises = availableInstances.map(async (instance) => {
            try {
                await remove(instance.id);
            } catch (error: any) {
                log.error("Failed to cleanup available instance", {
                    instanceId: instance.id,
                    error: error.message
                });
                // Continue cleanup even if one fails
            }
        });

        await Promise.all(availableCleanupPromises);

        // Clean up current instance separately (since remove() doesn't allow removing current)
        if (currentInstance) {
            try {
                log.info("Cleaning up current instance", {
                    instanceId: currentInstance.id,
                    directory: currentInstance.directory
                });

                // Remove SDK
                await SDK.remove({
                    type: currentInstance.sdkType,
                    directory: currentInstance.directory,
                    metadata: currentInstance.metadata
                });

                // Remove integration
                await Integration.remove({
                    type: currentInstance.type,
                    directory: currentInstance.directory,
                    metadata: currentInstance.metadata
                });

                log.info("Current instance cleaned up successfully", {
                    instanceId: currentInstance.id
                });
            } catch (error: any) {
                log.error("Failed to cleanup current instance", {
                    instanceId: currentInstance.id,
                    error: error.message
                });
            }
        }

        // Clear all instance state
        currentInstance = null;
        availableInstances.length = 0;

        log.info("Instance cleanup completed");
    }
}
