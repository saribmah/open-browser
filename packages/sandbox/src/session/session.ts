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
            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            log.info("Getting sessions for instance", {
                sdkType: state.sdkType,
                directory
            });

            // Get sessions from SDK
            const sessions = await SDK.getSessions({
                type: state.sdkType,
                directory
            });

            log.info("Sessions retrieved successfully", {
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
            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            log.info("Creating session for instance", {
                sdkType: state.sdkType,
                directory
            });

            // Create session in SDK
            const session = await SDK.createSession({
                type: state.sdkType,
                directory
            });

            log.info("Session created successfully", {
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
