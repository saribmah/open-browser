import { Log } from "../util/log";

const log = Log.create({ service: "claude-code-sdk" });

/**
 * Claude Code SDK configuration
 */
export const CLAUDE_CODE = {
    type: "CLAUDE_CODE" as const,
    name: "Claude Code",
    setup: async (opts: { directory: string; metadata?: Record<string, any> }) => {
        const { directory, metadata } = opts;
        
        log.warn("Claude Code SDK not supported yet", { 
            directory,
            metadata
        });

        throw new Error("Claude Code SDK is not supported yet. Please use OPENCODE instead.");
    },
    remove: async (opts: { directory: string; metadata?: Record<string, any> }) => {
        const { directory, metadata } = opts;
        
        log.warn("Claude Code SDK not supported yet", { 
            directory,
            metadata
        });

        throw new Error("Claude Code SDK is not supported yet.");
    }
};
