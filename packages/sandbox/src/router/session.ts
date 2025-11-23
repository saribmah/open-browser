import { Hono } from "hono";
import { describeRoute, resolver } from 'hono-openapi';
import { z } from "zod";
import { Session } from "../session/session";
import { Message } from "../message/message";

const route = new Hono();

const ErrorSchema = z.object({
    error: z.string()
});

const SessionSchema = z.object({
    id: z.string(),
    title: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
}).passthrough();

const SessionsResponseSchema = z.object({
    sessions: z.array(SessionSchema)
});

// Use the comprehensive message schemas from Message namespace
const MessagesResponseSchema = Message.MessagesResponseSchema;
const PromptRequestSchema = Message.PromptRequestSchema;
const PromptResponseSchema = Message.PromptResponseSchema;

// GET /session - Get all sessions for current instance
route.get(
    "/",
    describeRoute({
        description: 'Get All Sessions',
        responses: {
            200: {
                description: 'Sessions retrieved successfully',
                content: {
                    'application/json': { schema: resolver(SessionsResponseSchema) },
                },
            },
            400: {
                description: 'Bad request',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
        },
    }),
    async (c) => {
        const result = await Session.getAll();

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to get sessions"
            }, 400);
        }

        return c.json({
            sessions: result.sessions || []
        });
    },
);

// POST /session - Create a new session for current instance
route.post(
    "/",
    describeRoute({
        description: 'Create New Session',
        responses: {
            200: {
                description: 'Session created successfully',
                content: {
                    'application/json': { schema: resolver(SessionSchema) },
                },
            },
            400: {
                description: 'Bad request',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
        },
    }),
    async (c) => {
        const result = await Session.create();

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to create session"
            }, 400);
        }

        return c.json(result.session);
    },
);

// GET /session/:id/messages - Get all messages for a session
route.get(
    "/:id/messages",
    describeRoute({
        description: 'Get Messages for Session',
        responses: {
            200: {
                description: 'Messages retrieved successfully',
                content: {
                    'application/json': { schema: resolver(MessagesResponseSchema) },
                },
            },
            400: {
                description: 'Bad request',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
            404: {
                description: 'Session not found',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
        },
    }),
    async (c) => {
        const sessionId = c.req.param("id");

        if (!sessionId) {
            return c.json({
                error: "Session ID is required"
            }, 400);
        }

        const result = await Session.getMessages(sessionId);

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to get messages"
            }, 400);
        }

        return c.json(result.messages || []);
    },
);

// POST /session/:id/message - Send a message to a session
route.post(
    "/:id/message",
    describeRoute({
        description: 'Send Message to Session',
        responses: {
            200: {
                description: 'Message sent successfully',
                content: {
                    'application/json': { schema: resolver(PromptResponseSchema) },
                },
            },
            400: {
                description: 'Bad request',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
            404: {
                description: 'Session not found',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
        },
    }),
    async (c) => {
        const sessionId = c.req.param("id");

        if (!sessionId) {
            return c.json({
                error: "Session ID is required"
            }, 400);
        }

        const body = await c.req.json();
        
        // Validate request body against schema
        const parseResult = PromptRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return c.json({
                error: "Invalid request body",
                details: parseResult.error.message
            }, 400);
        }

        const result = await Session.sendMessage(sessionId, parseResult.data);

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to send message"
            }, 400);
        }

        return c.json(result.message);
    },
);

export { route as sessionRoutes };
