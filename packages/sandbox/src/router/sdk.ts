import { Hono } from "hono";
import { describeRoute, resolver } from 'hono-openapi';
import { z } from "zod";
import { SDK } from "../sdk/sdk";
import { Instance } from "../instance/instance";

const route = new Hono();

interface SDKInfo {
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

const ErrorSchema = z.object({
    error: z.string()
});

const SDKConfigResponseSchema = z.record(z.string(), z.any());

const availableSDKs: SDKInfo[] = [
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

// GET /sdk/config - Get SDK config for current instance
route.get(
    "/config",
    describeRoute({
        description: 'Get SDK Config',
        responses: {
            200: {
                description: 'SDK config retrieved successfully',
                content: {
                    'application/json': { schema: resolver(SDKConfigResponseSchema) },
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
        try {
            // Get instance state
            const state = Instance.getState();
            const directory = Instance.getDirectory();

            // Get SDK config
            const config = await SDK.getSDKConfig({
                type: state.sdkType,
                directory
            });

            return c.json(config);
        } catch (error: any) {
            return c.json({
                error: error.message || "Failed to get SDK config"
            }, 400);
        }
    },
);

export { route as sdkRoutes };
