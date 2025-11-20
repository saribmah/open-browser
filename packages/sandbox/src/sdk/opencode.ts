import { createOpencode, createOpencodeServer } from "@opencode-ai/sdk";
import { Log } from "../util/log";

const log = Log.create({ service: "opencode-sdk" });

// Store active OpenCode instances by directory
const instances = new Map<string, Awaited<ReturnType<typeof createOpencode>>>();

/**
 * OpenCode SDK configuration
 */
export const OPENCODE = {
    type: "OPENCODE" as const,
    name: "OpenCode",
    setup: async (opts: { directory: string; metadata?: Record<string, any> }) => {
        const { directory, metadata } = opts;

        log.info("Setting up OpenCode SDK", {
            directory,
            metadata
        });

        try {
            // Check if instance already exists for this directory
            if (instances.has(directory)) {
                log.info("OpenCode SDK instance already exists for directory", { directory });
                return;
            }

            // Create OpenCode instance with server + client
            const opencode = await createOpencode({
                hostname: metadata?.hostname || "127.0.0.1",
                port: metadata?.port || 4096,
                config: {
                    model: metadata?.model || "anthropic/claude-3-5-sonnet-20241022",
                    ...(metadata?.config || {})
                },
            });

            // Store the instance
            instances.set(directory, opencode);

            log.info("OpenCode SDK setup completed", {
                directory,
                serverUrl: opencode.server.url,
                port: metadata?.port || 4096
            });
        } catch (error: any) {
            log.error("Failed to setup OpenCode SDK", {
                error: error.message,
                directory
            });
            throw new Error(`Failed to setup OpenCode SDK: ${error.message}`);
        }
    },
    remove: async (opts: { directory: string; metadata?: Record<string, any> }) => {
        const { directory, metadata } = opts;

        log.info("Removing OpenCode SDK", {
            directory,
            metadata
        });

        try {
            // Get the instance
            const opencode = instances.get(directory);

            if (opencode) {
                // Close the server
                opencode.server.close();

                // Remove from instances map
                instances.delete(directory);

                log.info("OpenCode SDK removed successfully", {
                    directory
                });
            } else {
                log.warn("No OpenCode SDK instance found for directory", { directory });
            }
        } catch (error: any) {
            log.error("Failed to remove OpenCode SDK", {
                error: error.message,
                directory
            });
            throw new Error(`Failed to remove OpenCode SDK: ${error.message}`);
        }
    },
    getSessions: async (opts: { directory: string }) => {
        const { directory } = opts;
        
        log.info("Getting sessions from OpenCode SDK", { directory });

        try {
            // Get the instance
            const opencode = instances.get(directory);
            
            if (!opencode) {
                log.error("No OpenCode SDK instance found for directory", { directory });
                throw new Error(`No OpenCode SDK instance found for directory: ${directory}`);
            }

            // Get sessions using the OpenCode client
            const response = await opencode.client.session.list();
            
            if (!response.data) {
                log.warn("No session data returned from OpenCode SDK", { directory });
                return [];
            }

            log.info("Sessions retrieved successfully", { 
                directory,
                count: response.data.length
            });

            return response.data;
        } catch (error: any) {
            log.error("Failed to get sessions from OpenCode SDK", { 
                error: error.message,
                directory
            });
            throw new Error(`Failed to get sessions: ${error.message}`);
        }
    },
    createSession: async (opts: { directory: string }) => {
        const { directory } = opts;
        
        log.info("Creating session in OpenCode SDK", { directory });

        try {
            // Get the instance
            const opencode = instances.get(directory);
            
            if (!opencode) {
                log.error("No OpenCode SDK instance found for directory", { directory });
                throw new Error(`No OpenCode SDK instance found for directory: ${directory}`);
            }

            // Create session using the OpenCode client
            const response = await opencode.client.session.create({
                body: {}
            });
            
            if (!response.data) {
                log.error("No session data returned from OpenCode SDK", { directory });
                throw new Error("Failed to create session: No data returned");
            }

            log.info("Session created successfully", { 
                directory,
                sessionId: response.data.id
            });

            return response.data;
        } catch (error: any) {
            log.error("Failed to create session in OpenCode SDK", { 
                error: error.message,
                directory
            });
            throw new Error(`Failed to create session: ${error.message}`);
        }
    }
};

/**
 * Get OpenCode instance for a directory
 */
export function getOpencodeInstance(directory: string) {
    return instances.get(directory);
}
