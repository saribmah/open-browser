import { Hono } from "hono";
import { describeRoute, resolver } from 'hono-openapi';
import { z } from "zod";
import { Config } from "../config/config";

const route = new Hono();

const ErrorSchema = z.object({
    error: z.string()
});

const ProviderSchema = z.object({
    id: z.string(),
    name: z.string(),
    models: z.record(z.string(), z.any()).optional()
}).passthrough();

const ProvidersResponseSchema = z.object({
    providers: z.array(ProviderSchema),
    default: z.record(z.string(), z.string())
});

// GET /config/providers - Get all providers for current instance
route.get(
    "/providers",
    describeRoute({
        description: 'Get All Providers',
        responses: {
            200: {
                description: 'Providers retrieved successfully',
                content: {
                    'application/json': { schema: resolver(ProvidersResponseSchema) },
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
        const result = await Config.providers();

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to get providers"
            }, 400);
        }

        return c.json(result.providers);
    },
);

export { route as configRoutes };
