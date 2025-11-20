import { Hono } from "hono";
import { describeRoute, resolver } from 'hono-openapi';
import { z } from "zod";

const route = new Hono();

interface SDK {
    id: string;
    name: string;
    description: string;
    version: string;
}

const SDKSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    version: z.string()
});

const availableSDKs: SDK[] = [
    {
        id: "opencode",
        name: "OpenCode",
        description: "AI-powered coding assistant SDK",
        version: "1.0.80"
    }
];

route.get(
    "/",
    describeRoute({
        description: 'Get Available SDKs',
        responses: {
            200: {
                description: 'Successful response',
                content: {
                    'application/json': { 
                        schema: resolver(z.array(SDKSchema)) 
                    },
                },
            },
        },
    }),
    async (c) => {
        return c.json(availableSDKs);
    });

export { route as sdkRoutes };
