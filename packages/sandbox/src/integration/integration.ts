import { GITHUB } from "./github";
import { ARXIV } from "./arxiv";

export namespace Integration {
    /**
     * Supported integration types
     */
    export type Type = "GITHUB" | "ARXIV";

    /**
     * Integration configuration for each type
     */
    export interface Config {
        type: Type;
        urlPattern: RegExp;
        parseUrl: (url: string) => { id: string; metadata?: Record<string, any> } | null;
        setup: (opts: { url: string; directory: string; metadata?: Record<string, any> }) => Promise<void>;
    }

    /**
     * Map of integration types to their configurations
     */
    const integrations: Record<Type, Config> = {
        GITHUB,
        ARXIV
    };

    /**
     * Get integration config for a specific type
     */
    export function getConfig(type: Type): Config {
        return integrations[type];
    }

    /**
     * Validate if a type is supported
     */
    export function isValidType(type: string): type is Type {
        return type === "GITHUB" || type === "ARXIV";
    }

    /**
     * Parse a URL for a specific integration type
     */
    export function parseUrl(url: string, type: Type): { id: string; metadata?: Record<string, any> } {
        const config = getConfig(type);
        const result = config.parseUrl(url);
        
        if (!result) {
            throw new Error(`Invalid ${type} URL format: ${url}`);
        }
        
        return result;
    }

    /**
     * Validate a URL for a specific integration type
     */
    export function validateUrl(url: string, type: Type): boolean {
        const config = getConfig(type);
        return config.urlPattern.test(url);
    }

    /**
     * Get all supported integration types
     */
    export function getSupportedTypes(): Type[] {
        return Object.keys(integrations) as Type[];
    }

    /**
     * Setup an integration in a directory
     */
    export async function setup(opts: {
        url: string;
        type: Type;
        directory: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const config = getConfig(opts.type);
        await config.setup({
            url: opts.url,
            directory: opts.directory,
            metadata: opts.metadata
        });
    }
}
