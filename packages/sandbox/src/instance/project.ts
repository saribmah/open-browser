import { Log } from "../util/log";
import { Integration } from "../integration/integration";
import path from "path";

const log = Log.create({ service: "project" });

// Base directory for all instances - from env or current working directory
const WORKSPACE_DIR = process.env["WORKSPACE_DIR"] || process.cwd();

export namespace Project {

    export interface Item {
        id: string;
        type: Integration.Type;
        url: string;
        directory: string;
        metadata?: Record<string, any>;
    }

    export interface State {
        currentProject: Item | null;
        projects: Item[];
    }

    let state: State = {
        currentProject: null,
        projects: []
    };

    /**
     * Validate instance type
     */
    function validateType(type: string): type is Integration.Type {
        return Integration.isValidType(type);
    }

    /**
     * Get the current project state
     */
    export function getState(): State {
        return state;
    }

    /**
     * Get the current active project
     */
    export function getCurrent(): Item | null {
        return state.currentProject;
    }

    /**
     * Create a project from a URL and type
     */
    function createProjectFromUrl(url: string, type: Integration.Type, directory: string): Item {
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
    export async function add(opts: {
        url: string;
        type: Integration.Type;
        directory: string;
    }): Promise<{ success: boolean; project?: Item; error?: string }> {
        // Construct full directory path using WORKSPACE_DIR
        const fullDirectory = path.join(WORKSPACE_DIR, opts.directory);

        log.info("Adding project", {
            url: opts.url,
            type: opts.type,
            directory: opts.directory,
            fullDirectory,
            baseDir: WORKSPACE_DIR
        });

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
    export function switchTo(projectId: string): { success: boolean; error?: string; project?: Item } {
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
    export async function remove(projectId: string): Promise<{ success: boolean; error?: string }> {
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
    export function getAll(): Item[] {
        return state.projects;
    }

    /**
     * Cleanup all projects - called during process shutdown
     */
    export async function cleanup(): Promise<void> {
        log.info("Starting project cleanup", {
            currentProject: state.currentProject?.id,
            projectsCount: state.projects.length
        });

        if (state.projects.length === 0) {
            log.info("No projects to cleanup");
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

        // Clear all state
        state = {
            currentProject: null,
            projects: []
        };

        log.info("Project cleanup completed");
    }

    /**
     * Reset state (for testing)
     */
    export function reset(): void {
        state = {
            currentProject: null,
            projects: []
        };
    }
}
