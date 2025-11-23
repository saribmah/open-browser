import { OPENCODE } from "./opencode.ts";
import { CLAUDE_CODE } from "./claude-code.ts";
import { Message } from "../message/message";
import type { SSE } from "../sse/sse";

export namespace SDK {
    /**
     * Supported SDK types
     */
    export type Type = "OPENCODE" | "CLAUDE_CODE";

    /**
     * Session data structure
     */
    export interface Session {
        id: string;
        title?: string;
        createdAt?: string;
        updatedAt?: string;
        [key: string]: any;
    }

    /**
     * Provider data structure (matches OpenCode SDK)
     */
    export interface Provider {
        id: string;
        name: string;
        models?: { [key: string]: any };
        [key: string]: any;
    }

    /**
     * Providers response structure
     */
    export interface ProvidersResponse {
        providers: Provider[];
        default: { [key: string]: string };
    }

    /**
     * SDK Config response structure
     */
    export interface SDKConfigResponse {
        [key: string]: any;
    }

    /**
     * Export message types from Message namespace
     */
    export type MessageInfo = Message.MessageInfo;
    export type Part = Message.Part;
    export type MessageWithParts = Message.MessageWithParts;
    export type MessagesResponse = Message.MessagesResponse;
    export type PromptRequest = Message.PromptRequest;
    export type PromptResponse = Message.PromptResponse;
    export type PartInput = Message.PartInput;

    /**
     * SDK configuration for each type
     */
    export interface Config {
        type: Type;
        name: string;
        setup: (opts: { directory: string; metadata?: Record<string, any> }) => Promise<void>;
        remove: (opts: { directory: string; metadata?: Record<string, any> }) => Promise<void>;
        getSessions: (opts: { directory: string }) => Promise<Session[]>;
        createSession: (opts: { directory: string }) => Promise<Session>;
        getConfig: (opts: { directory: string }) => Promise<SDKConfigResponse>;
        getProviders: (opts: { directory: string }) => Promise<ProvidersResponse>;
        getMessages: (opts: { directory: string; sessionId: string }) => Promise<MessageWithParts[]>;
        sendMessage: (opts: { directory: string; sessionId: string; request: PromptRequest }) => Promise<PromptResponse>;
        streamMessage: (opts: { directory: string; sessionId: string; request: PromptRequest; sse: ReturnType<typeof SSE.create> }) => Promise<void>;
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

    /**
     * Get all sessions for an SDK instance
     */
    export async function getSessions(opts: {
        type: Type;
        directory: string;
    }): Promise<Session[]> {
        const config = getConfig(opts.type);
        return await config.getSessions({
            directory: opts.directory
        });
    }

    /**
     * Create a new session for an SDK instance
     */
    export async function createSession(opts: {
        type: Type;
        directory: string;
    }): Promise<Session> {
        const config = getConfig(opts.type);
        return await config.createSession({
            directory: opts.directory
        });
    }

    /**
     * Get SDK config
     */
    export async function getSDKConfig(opts: {
        type: Type;
        directory: string;
    }): Promise<SDKConfigResponse> {
        const config = getConfig(opts.type);
        return await config.getConfig({
            directory: opts.directory
        });
    }

    /**
     * Get providers for an SDK instance
     */
    export async function getProviders(opts: {
        type: Type;
        directory: string;
    }): Promise<ProvidersResponse> {
        const config = getConfig(opts.type);
        return await config.getProviders({
            directory: opts.directory
        });
    }

    /**
     * Get messages for a session
     */
    export async function getMessages(opts: {
        type: Type;
        directory: string;
        sessionId: string;
    }): Promise<MessageWithParts[]> {
        const config = getConfig(opts.type);
        return await config.getMessages({
            directory: opts.directory,
            sessionId: opts.sessionId
        });
    }

    /**
     * Send a message to a session
     */
    export async function sendMessage(opts: {
        type: Type;
        directory: string;
        sessionId: string;
        request: PromptRequest;
    }): Promise<PromptResponse> {
        const config = getConfig(opts.type);
        return await config.sendMessage({
            directory: opts.directory,
            sessionId: opts.sessionId,
            request: opts.request
        });
    }

    /**
     * Stream a message to a session
     */
    export async function streamMessage(opts: {
        type: Type;
        directory: string;
        sessionId: string;
        request: PromptRequest;
        sse: ReturnType<typeof SSE.create>;
    }): Promise<void> {
        const config = getConfig(opts.type);
        return await config.streamMessage({
            directory: opts.directory,
            sessionId: opts.sessionId,
            request: opts.request,
            sse: opts.sse
        });
    }
}
