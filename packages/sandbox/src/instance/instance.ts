import { Log } from "../util/log";
import { SDK } from "../sdk/sdk";
import { Project } from "./project";

const log = Log.create({ service: "instance" });

// Base directory for all instances - from env or current working directory
const WORKSPACE_DIR = process.env["WORKSPACE_DIR"] || process.cwd();

export namespace Instance {

    export interface State {
        sdkType: SDK.Type;
        directory: string;
    }

    let state: State = {
        sdkType: "OPENCODE",
        directory: WORKSPACE_DIR,
    };

    let sdkInitialized = false;

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
        directory?: string;
    }) {
        const directory = opts.directory || WORKSPACE_DIR;

        log.info("Initializing SDK", {
            sdkType: opts.sdkType,
            directory
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
        state.directory = directory;

        // Setup the SDK with workspace directory
        log.info("Setting up SDK", {
            sdkType: opts.sdkType,
            directory
        });

        await SDK.setup({
            type: opts.sdkType,
            directory,
            metadata: {}
        });

        sdkInitialized = true;
        log.info("SDK initialized successfully", {
            sdkType: opts.sdkType,
            directory
        });
    }

    /**
     * Get the current instance state
     */
    export function getState(): State {
        return state;
    }

    /**
     * Get SDK initialized status
     */
    export function isInitialized(): boolean {
        return sdkInitialized;
    }

    /**
     * Get SDK type
     */
    export function getSDKType(): SDK.Type {
        return state.sdkType;
    }

    /**
     * Get instance directory
     */
    export function getDirectory(): string {
        return state.directory;
    }

    /**
     * Cleanup all projects and SDK - called during process shutdown
     */
    export async function cleanup(): Promise<void> {
        log.info("Starting instance cleanup", {
            sdkType: state.sdkType
        });

        if (!sdkInitialized) {
            log.info("No SDK to cleanup");
            return;
        }

        // Clean up all projects first
        await Project.cleanup();

        // Clean up SDK
        if (sdkInitialized) {
            try {
                log.info("Cleaning up SDK", {
                    sdkType: state.sdkType,
                    directory: state.directory
                });

                await SDK.remove({
                    type: state.sdkType,
                    directory: state.directory,
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
            directory: WORKSPACE_DIR,
        };
        sdkInitialized = false;

        log.info("Instance cleanup completed");
    }
}
