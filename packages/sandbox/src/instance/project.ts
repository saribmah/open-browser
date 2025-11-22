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
        projects: Item[];
    }

    let state: State = {
        projects: []
    };

    /**
     * Validate instance type
     */
    function validateType(type: string): type is Integration.Type {
        return Integration.isValidType(type);
    }

    /**
     * Get full directory path for a project
     */
    function getFullDirectory(project: Item): string {
        return path.join(WORKSPACE_DIR, project.directory);
    }

    /**
     * Get the current project state
     */
    export function getState(): State {
        return state;
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
        directory?: string;
    }): Promise<{ success: boolean; project?: Item; error?: string }> {
        // Detect integration type from URL
        const type = Integration.detectType(opts.url);
        
        if (!type) {
            const supported = Integration.getSupportedTypes().join(", ");
            return {
                success: false,
                error: `Could not detect integration type from URL. Supported types: ${supported}`
            };
        }

        // Generate directory name if not provided
        const directoryName = opts.directory || Integration.generateDirectory(opts.url, type);

        log.info("Adding project", {
            url: opts.url,
            type,
            typeDetected: true,
            directory: directoryName,
            directoryProvided: !!opts.directory,
            baseDir: WORKSPACE_DIR
        });

        const project = createProjectFromUrl(opts.url, type, directoryName);
        
        // Check if project already exists
        const exists = state.projects.find(p => p.id === project.id);
        if (exists) {
            return {
                success: false,
                error: "Project already exists"
            };
        }

        try {
            const fullDirectory = getFullDirectory(project);
            
            // Setup the integration
            log.info("Setting up project integration", {
                projectId: project.id,
                directory: project.directory,
                fullDirectory
            });

            await Integration.setup({
                url: project.url,
                type: project.type,
                directory: fullDirectory,
                metadata: project.metadata
            });

            state.projects.push(project);

            log.info("Project added successfully", {
                projectId: project.id,
                directory: project.directory,
                fullDirectory,
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
            const fullDirectory = getFullDirectory(project);
            
            // Remove integration
            await Integration.remove({
                type: project.type,
                directory: fullDirectory,
                metadata: project.metadata
            });

            // Remove from projects array
            const index = state.projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                state.projects.splice(index, 1);
            }

            log.info("Project removed successfully", {
                projectId,
                directory: project.directory,
                fullDirectory,
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
            projectsCount: state.projects.length
        });

        if (state.projects.length === 0) {
            log.info("No projects to cleanup");
            return;
        }

        // Clean up all projects
        const cleanupPromises = state.projects.map(async (project) => {
            try {
                const fullDirectory = getFullDirectory(project);
                
                await Integration.remove({
                    type: project.type,
                    directory: fullDirectory,
                    metadata: project.metadata
                });
                log.info("Project cleaned up", { 
                    projectId: project.id,
                    directory: project.directory,
                    fullDirectory
                });
            } catch (error: any) {
                log.error("Failed to cleanup project", {
                    projectId: project.id,
                    directory: project.directory,
                    error: error.message
                });
            }
        });

        await Promise.all(cleanupPromises);

        // Clear all state
        state = {
            projects: []
        };

        log.info("Project cleanup completed");
    }

    /**
     * Reset state (for testing)
     */
    export function reset(): void {
        state = {
            projects: []
        };
    }
}
