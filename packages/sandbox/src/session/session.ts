import { Log } from "../util/log";
import { Instance } from "../instance/instance";
import { SDK } from "../sdk/sdk";

const log = Log.create({ service: "session" });

export namespace Session {
    /**
     * Get all sessions for the current instance
     */
    export async function getAll(): Promise<{ success: boolean; sessions?: SDK.Session[]; error?: string }> {
        log.info("Getting all sessions");

        try {
            // Get current instance
            const currentInstance = Instance.getCurrent();
            
            if (!currentInstance) {
                log.error("No current instance set");
                return {
                    success: false,
                    error: "No current instance set"
                };
            }

            log.info("Getting sessions for instance", {
                instanceId: currentInstance.id,
                sdkType: currentInstance.sdkType,
                directory: currentInstance.directory
            });

            // Get sessions from SDK
            const sessions = await SDK.getSessions({
                type: currentInstance.sdkType,
                directory: currentInstance.directory
            });

            log.info("Sessions retrieved successfully", {
                instanceId: currentInstance.id,
                count: sessions.length
            });

            return {
                success: true,
                sessions
            };
        } catch (error: any) {
            log.error("Failed to get sessions", {
                error: error.message
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new session for the current instance
     */
    export async function create(): Promise<{ success: boolean; session?: SDK.Session; error?: string }> {
        log.info("Creating new session");

        try {
            // Get current instance
            const currentInstance = Instance.getCurrent();
            
            if (!currentInstance) {
                log.error("No current instance set");
                return {
                    success: false,
                    error: "No current instance set"
                };
            }

            log.info("Creating session for instance", {
                instanceId: currentInstance.id,
                sdkType: currentInstance.sdkType,
                directory: currentInstance.directory
            });

            // Create session in SDK
            const session = await SDK.createSession({
                type: currentInstance.sdkType,
                directory: currentInstance.directory
            });

            log.info("Session created successfully", {
                instanceId: currentInstance.id,
                sessionId: session.id
            });

            return {
                success: true,
                session
            };
        } catch (error: any) {
            log.error("Failed to create session", {
                error: error.message
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
}
