import { Hono } from "hono";
import { describeRoute, resolver } from 'hono-openapi';
import { z } from "zod";

const route = new Hono();

const ErrorSchema = z.object({
    error: z.string()
});

route.get(
    "/",
    describeRoute({
        description: 'Get Session Information',
        responses: {
            404: {
                description: 'Session not found',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
        },
    }),
    async (c) => {
        return c.json({ error: "Session not found" }, 404);
    },
);

export { route as sessionRoutes };
