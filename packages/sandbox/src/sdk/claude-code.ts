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
    },
    getSessions: async (opts: { directory: string }) => {
        const { directory } = opts;
        
        log.warn("Claude Code SDK not supported yet", { directory });

        throw new Error("Claude Code SDK is not supported yet. Please use OPENCODE instead.");
    },
    createSession: async (opts: { directory: string }) => {
        const { directory } = opts;
        
        log.warn("Claude Code SDK not supported yet", { directory });

        throw new Error("Claude Code SDK is not supported yet. Please use OPENCODE instead.");
    },
    getProviders: async (opts: { directory: string }) => {
        const { directory } = opts;
        
        log.warn("Claude Code SDK not supported yet", { directory });

        throw new Error("Claude Code SDK is not supported yet. Please use OPENCODE instead.");
    },
    getMessages: async (opts: { directory: string; sessionId: string }) => {
        const { directory, sessionId } = opts;
        
        log.warn("Claude Code SDK not supported yet", { directory, sessionId });

        throw new Error("Claude Code SDK is not supported yet. Please use OPENCODE instead.");
    },
    sendMessage: async (opts: { directory: string; sessionId: string; request: any }) => {
        const { directory, sessionId, request } = opts;
        
        log.warn("Claude Code SDK not supported yet", { directory, sessionId, request });

        throw new Error("Claude Code SDK is not supported yet. Please use OPENCODE instead.");
    },
    streamMessage: async (opts: { directory: string; sessionId: string; request: any; sse: any }) => {
        const { directory, sessionId, request, sse } = opts;
        
        log.warn("Claude Code SDK not supported yet", { directory, sessionId, request, sse });

        throw new Error("Claude Code SDK is not supported yet. Please use OPENCODE instead.");
    }
};
