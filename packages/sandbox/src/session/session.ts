import { Log } from "../util/log";
import { Instance } from "../instance/instance";
import { Project } from "../instance/project";
import { SDK } from "../sdk/sdk";

const log = Log.create({ service: "session" });

export namespace Session {
    /**
     * Get all sessions for the current instance
     */
    export async function getAll(): Promise<{ success: boolean; sessions?: SDK.Session[]; error?: string }> {
        log.info("Getting all sessions");

        try {
            // Get current project
            const currentProject = Project.getCurrent();
            
            if (!currentProject) {
                log.error("No current project set");
                return {
                    success: false,
                    error: "No current project set"
                };
            }

            // Get SDK type from state
            const state = Instance.getState();

            log.info("Getting sessions for project", {
                projectId: currentProject.id,
                sdkType: state.sdkType,
                directory: currentProject.directory
            });

            // Get sessions from SDK
            const sessions = await SDK.getSessions({
                type: state.sdkType,
                directory: currentProject.directory
            });

            log.info("Sessions retrieved successfully", {
                projectId: currentProject.id,
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
            // Get current project
            const currentProject = Project.getCurrent();
            
            if (!currentProject) {
                log.error("No current project set");
                return {
                    success: false,
                    error: "No current project set"
                };
            }

            // Get SDK type from state
            const state = Instance.getState();

            log.info("Creating session for project", {
                projectId: currentProject.id,
                sdkType: state.sdkType,
                directory: currentProject.directory
            });

            // Create session in SDK
            const session = await SDK.createSession({
                type: state.sdkType,
                directory: currentProject.directory
            });

            log.info("Session created successfully", {
                projectId: currentProject.id,
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
