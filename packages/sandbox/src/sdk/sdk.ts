import { OPENCODE } from "./opencode.ts";
import { CLAUDE_CODE } from "./claude-code.ts";

export namespace SDK {
    /**
     * Supported SDK types
     */
    export type Type = "OPENCODE" | "CLAUDE_CODE";

    /**
     * SDK configuration for each type
     */
    export interface Config {
        type: Type;
        name: string;
        setup: (opts: { directory: string; metadata?: Record<string, any> }) => Promise<void>;
        remove: (opts: { directory: string; metadata?: Record<string, any> }) => Promise<void>;
    }

    /**
     * Map of SDK types to their configurations
     */
    const sdks: Record<Type, Config> = {
        OPENCODE,
        CLAUDE_CODE
    };

    /**
     * Get SDK config for a specific type
     */
    export function getConfig(type: Type): Config {
        return sdks[type];
    }

    /**
     * Validate if a type is supported
     */
    export function isValidType(type: string): type is Type {
        return type === "OPENCODE" || type === "CLAUDE_CODE";
    }

    /**
     * Get all supported SDK types
     */
    export function getSupportedTypes(): Type[] {
        return Object.keys(sdks) as Type[];
    }

    /**
     * Setup an SDK in a directory
     */
    export async function setup(opts: {
        type: Type;
        directory: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const config = getConfig(opts.type);
        await config.setup({
            directory: opts.directory,
            metadata: opts.metadata
        });
    }

    /**
     * Remove an SDK from a directory
     */
    export async function remove(opts: {
        type: Type;
        directory: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const config = getConfig(opts.type);
        await config.remove({
            directory: opts.directory,
            metadata: opts.metadata
        });
    }
}
