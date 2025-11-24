import { Log } from "../util/log";
import { Instance } from "../instance/instance";
import { SDK } from "../sdk/sdk";
import type { SSEStreamingApi } from "hono/streaming";
import { SSE } from "../sse/sse";

const log = Log.create({ service: "session" });

export namespace Session {
    /**
     * Get all sessions for the current instance
     */
    export async function getAll(): Promise<{ success: boolean; sessions?: SDK.Session[]; error?: string }> {
        log.info("Getting all sessions");

        try {
            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            log.info("Getting sessions for instance", {
                sdkType: state.sdkType,
                directory
            });

            // Get sessions from SDK
            const sessions = await SDK.getSessions({
                type: state.sdkType,
                directory
            });

            log.info("Sessions retrieved successfully", {
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
            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            log.info("Creating session for instance", {
                sdkType: state.sdkType,
                directory
            });

            // Create session in SDK
            const session = await SDK.createSession({
                type: state.sdkType,
                directory
            });

            log.info("Session created successfully", {
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

    /**
     * Get messages for a session
     */
    export async function getMessages(sessionId: string): Promise<{ success: boolean; messages?: SDK.MessageWithParts[]; error?: string }> {
        log.info("Getting messages for session", { sessionId });

        try {
            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            log.info("Getting messages for session", {
                sdkType: state.sdkType,
                directory,
                sessionId
            });

            // Get messages from SDK
            const messages = await SDK.getMessages({
                type: state.sdkType,
                directory,
                sessionId
            });

            log.info("Messages retrieved successfully", {
                sessionId,
                count: messages.length
            });

            return {
                success: true,
                messages
            };
        } catch (error: any) {
            log.error("Failed to get messages", {
                error: error.message,
                sessionId
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send a message to a session
     */
    export async function sendMessage(sessionId: string, request: SDK.PromptRequest): Promise<{ success: boolean; message?: SDK.PromptResponse; error?: string }> {
        log.info("Sending message to session", { sessionId, request });

        try {
            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            log.info("Sending message to session", {
                sdkType: state.sdkType,
                directory,
                sessionId
            });

            // Send message via SDK
            const message = await SDK.sendMessage({
                type: state.sdkType,
                directory,
                sessionId,
                request
            });

            log.info("Message sent successfully", {
                sessionId,
                messageId: message.info.id
            });

            return {
                success: true,
                message
            };
        } catch (error: any) {
            log.error("Failed to send message", {
                error: error.message,
                sessionId
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stream a message to a session with real-time events
     */
    export async function streamMessage(
        stream: SSEStreamingApi,
        sessionId: string,
        request: SDK.PromptRequest
    ): Promise<void> {
        const sse = SSE.create(stream);

        try {
            log.info("Streaming message to session", { sessionId, request });

            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            // Stream message via SDK
            await SDK.streamMessage({
                type: state.sdkType,
                directory,
                sessionId,
                request,
                sse
            });

            await sse.end("Message stream completed");
        } catch (error: any) {
            log.error("Failed to stream message", {
                error: error.message,
                sessionId
            });

            // Send error via SSE
            const payload = {
                name: error.name || "Error",
                message: error.message || "Unknown error occurred",
            };
            await sse.write("error", payload);
            await sse.end("Error occurred");
        }

        // Cleanup: ensure stream is properly ended
        if (!sse.ended) {
            await sse.end("Stream cleanup");
        }
    }
}
