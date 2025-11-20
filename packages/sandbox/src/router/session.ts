import { Hono } from "hono";
import { describeRoute, resolver } from 'hono-openapi';
import { z } from "zod";
import { Session } from "../session/session";

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

export { route as sessionRoutes };
