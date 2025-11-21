import { Log } from "../util/log";
import { Integration } from "../integration/integration";
import { SDK } from "../sdk/sdk";
import path from "path";

const log = Log.create({ service: "instance" });

// Base directory for all instances - from env or current working directory
const WORKSPACE_DIR = process.env["WORKSPACE_DIR"] || process.cwd();

export namespace Instance {

    export interface Project {
        id: string;
        type: Integration.Type;
        url: string;
        directory: string;
        metadata?: Record<string, any>;
    }

    export interface State {
        sdkType: SDK.Type;
        currentProject: Project | null;
        projects: Project[];
    }

    let state: State = {
        sdkType: "OPENCODE",
        currentProject: null,
        projects: []
    };

    let sdkInitialized = false;

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
     * Initialize the SDK when server boots up
     * This should be called once at startup
     */
    export async function init(opts: {
        sdkType: SDK.Type;
    }) {
        log.info("Initializing SDK", {
            sdkType: opts.sdkType
        });

        // Validate SDK type
        if (!validateSDKType(opts.sdkType)) {
            const supported = SDK.getSupportedTypes().join(", ");
            throw new Error(`Invalid SDK type: ${opts.sdkType}. Must be one of: ${supported}`);
        }

        if (sdkInitialized) {
            log.warn("SDK already initialized, skipping");
            return;
        }

        state.sdkType = opts.sdkType;

        // Setup the SDK with workspace directory
        log.info("Setting up SDK", {
            sdkType: opts.sdkType,
            workspaceDir: WORKSPACE_DIR
        });

        await SDK.setup({
            type: opts.sdkType,
            directory: WORKSPACE_DIR,
            metadata: {}
        });

        sdkInitialized = true;
        log.info("SDK initialized successfully", {
            sdkType: opts.sdkType
        });
    }

    /**
     * Get the current instance state
     */
    export function getState(): State {
        return state;
    }

    /**
     * Get the current active project
     */
    export function getCurrent(): Project | null {
        return state.currentProject;
    }

    /**
     * Create a project from a URL and type
     */
    function createProjectFromUrl(url: string, type: Integration.Type, directory: string): Project {
        const parsed = Integration.parseUrl(url, type);

        return {
            id: parsed.id,
            type,
            url,
            directory,
            metadata: parsed.metadata
        };
    }

    /**
     * Add a new project
     */
    export async function addProject(opts: {
        url: string;
        type: Integration.Type;
        directory: string;
    }): Promise<{ success: boolean; project?: Project; error?: string }> {
        // Construct full directory path using WORKSPACE_DIR
        const fullDirectory = path.join(WORKSPACE_DIR, opts.directory);

        log.info("Adding project", {
            url: opts.url,
            type: opts.type,
            directory: opts.directory,
            fullDirectory,
            baseDir: WORKSPACE_DIR
        });

        if (!sdkInitialized) {
            return {
                success: false,
                error: "SDK not initialized. Call /instance/init first"
            };
        }

        // Validate integration type
        if (!validateType(opts.type)) {
            const supported = Integration.getSupportedTypes().join(", ");
            return {
                success: false,
                error: `Invalid project type: ${opts.type}. Must be one of: ${supported}`
            };
        }

        const project = createProjectFromUrl(opts.url, opts.type, fullDirectory);
        
        // Check if project already exists
        const exists = state.projects.find(p => p.id === project.id);
        if (exists) {
            return {
                success: false,
                error: "Project already exists"
            };
        }

        try {
            // Setup the integration
            log.info("Setting up project integration", {
                projectId: project.id,
                directory: fullDirectory
            });

            await Integration.setup({
                url: project.url,
                type: project.type,
                directory: fullDirectory,
                metadata: project.metadata
            });

            state.projects.push(project);

            // If this is the first project, make it current
            if (state.projects.length === 1) {
                state.currentProject = project;
                log.info("Set as current project (first project added)", {
                    projectId: project.id
                });
            }

            log.info("Project added successfully", {
                projectId: project.id,
                directory: fullDirectory,
                totalProjects: state.projects.length
            });

            return {
                success: true,
                project
            };
        } catch (error: any) {
            log.error("Failed to add project", {
                error: error.message,
                url: opts.url
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Switch to a different project
     */
    export function switchProject(projectId: string): { success: boolean; error?: string; project?: Project } {
        log.info("Attempting to switch project", { targetId: projectId });

        // Check if trying to switch to current project
        if (state.currentProject && state.currentProject.id === projectId) {
            return {
                success: false,
                error: "Already on this project"
            };
        }

        // Find the target project
        const targetProject = state.projects.find(p => p.id === projectId);

        if (!targetProject) {
            log.warn("Project not found", { projectId });
            return {
                success: false,
                error: "Project not found"
            };
        }

        // Set the new current project
        state.currentProject = targetProject;

        log.info("Project switched successfully", {
            newProject: state.currentProject.id
        });

        return {
            success: true,
            project: state.currentProject
        };
    }

    /**
     * Remove a project
     */
    export async function removeProject(projectId: string): Promise<{ success: boolean; error?: string }> {
        log.info("Attempting to remove project", { projectId });

        const project = state.projects.find(p => p.id === projectId);
        if (!project) {
            log.warn("Project not found", { projectId });
            return {
                success: false,
                error: "Project not found"
            };
        }

        try {
            // Remove integration
            await Integration.remove({
                type: project.type,
                directory: project.directory,
                metadata: project.metadata
            });

            // Remove from projects array
            const index = state.projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                state.projects.splice(index, 1);
            }

            // If we removed the current project, switch to another or set to null
            if (state.currentProject && state.currentProject.id === projectId) {
                state.currentProject = state.projects.length > 0 ? (state.projects[0] || null) : null;
                log.info("Current project removed, switched to", {
                    newCurrentProject: state.currentProject?.id || "none"
                });
            }

            log.info("Project removed successfully", {
                projectId,
                directory: project.directory,
                remainingProjects: state.projects.length
            });

            return { success: true };
        } catch (error: any) {
            log.error("Failed to remove project", {
                error: error.message,
                projectId,
                directory: project.directory
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all projects
     */
    export function getAllProjects(): Project[] {
        return state.projects;
    }

    /**
     * Cleanup all projects and SDK - called during process shutdown
     */
    export async function cleanup(): Promise<void> {
        log.info("Starting instance cleanup", {
            sdkType: state.sdkType,
            currentProject: state.currentProject?.id,
            projectsCount: state.projects.length
        });

        if (state.projects.length === 0 && !sdkInitialized) {
            log.info("No projects or SDK to cleanup");
            return;
        }

        // Clean up all projects
        const cleanupPromises = state.projects.map(async (project) => {
            try {
                await Integration.remove({
                    type: project.type,
                    directory: project.directory,
                    metadata: project.metadata
                });
                log.info("Project cleaned up", { projectId: project.id });
            } catch (error: any) {
                log.error("Failed to cleanup project", {
                    projectId: project.id,
                    error: error.message
                });
            }
        });

        await Promise.all(cleanupPromises);

        // Clean up SDK
        if (sdkInitialized) {
            try {
                log.info("Cleaning up SDK", {
                    sdkType: state.sdkType
                });

                await SDK.remove({
                    type: state.sdkType,
                    directory: WORKSPACE_DIR,
                    metadata: {}
                });

                log.info("SDK cleaned up successfully");
            } catch (error: any) {
                log.error("Failed to cleanup SDK", {
                    error: error.message
                });
            }
        }

        // Clear all state
        state = {
            sdkType: "OPENCODE",
            currentProject: null,
            projects: []
        };
        sdkInitialized = false;

        log.info("Instance cleanup completed");
    }
}
