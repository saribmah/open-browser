import { Hono } from "hono";
import { Instance } from "../instance/instance";
import { describeRoute, resolver, validator } from 'hono-openapi'
import {z} from "zod";

const InstanceStateSchema = z
    .object({
        id: z.string(),
        type: z.enum(["GITHUB", "ARXIV"]),
        url: z.string(),
        metadata: z.record(z.string(), z.any()).optional()
    })

const AddInstanceSchema = z
    .object({
        url: z.string(),
        type: z.enum(["GITHUB", "ARXIV"]),
        directory: z.string()
    })

const SwitchInstanceSchema = z
    .object({
        instanceId: z.string()
    })

const ErrorSchema = z
    .object({
        error: z.string()
    })

const SuccessSchema = z
    .object({
        success: z.boolean(),
        message: z.string().optional(),
        directory: z.string().optional(),
        instance: InstanceStateSchema.optional()
    })

const route = new Hono();

// GET /instance/current - Get the current active instance
route.get(
    "/current",
    describeRoute({
        description: 'Get Current Instance State',
        responses: {
            200: {
                description: 'Successful response',
                content: {
                    'text/plain': { schema: resolver(InstanceStateSchema) },
                },
            },
        },
    }),
    async (c) => {
    const current = Instance.getCurrent();

    if (!current) {
        return c.json({
            error: "No current instance set"
        }, 404);
    }

    return c.json(current);
});

// GET /instance/available - Get all available instances (excluding current)
route.get(
    "/available",
    describeRoute({
        description: 'Get All Available Instances',
        responses: {
            200: {
                description: 'Successful response',
                content: {
                    'application/json': { 
                        schema: resolver(z.array(InstanceStateSchema)) 
                    },
                },
            },
        },
    }),
    async (c) => {
        const available = Instance.getAvailable();
        return c.json(available);
    });

// POST /instance/add - Add a new instance to available instances
route.post(
    "/add",
    describeRoute({
        description: 'Add New Instance',
        responses: {
            200: {
                description: 'Instance added successfully',
                content: {
                    'application/json': { schema: resolver(SuccessSchema) },
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
    validator('json', AddInstanceSchema),
    async (c) => {
        const body = await c.req.json();
        const { url, type, directory } = body;

        if (!url) {
            return c.json({
                error: "url is required"
            }, 400);
        }

        if (!type) {
            return c.json({
                error: "type is required (GITHUB or ARXIV)"
            }, 400);
        }

        if (!directory) {
            return c.json({
                error: "directory is required"
            }, 400);
        }

        try {
            await Instance.add({ url, type, directory });
            return c.json({
                success: true,
                message: "Instance added and setup completed",
                directory
            });
        } catch (error: any) {
            return c.json({
                error: error.message
            }, 400);
        }
    });

// POST /instance/switch - Switch to a different instance
route.post(
    "/switch",
    describeRoute({
        description: 'Switch to Different Instance',
        responses: {
            200: {
                description: 'Instance switched successfully',
                content: {
                    'application/json': { schema: resolver(SuccessSchema) },
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
    validator('json', SwitchInstanceSchema),
    async (c) => {
        const body = await c.req.json();
        const { instanceId } = body;

        if (!instanceId) {
            return c.json({
                error: "instanceId is required"
            }, 400);
        }

        const result = Instance.switchTo(instanceId);

        if (!result.success) {
            return c.json({
                error: result.error
            }, 400);
        }

        return c.json({
            success: true,
            instance: result.instance
        });
    });

export { route as instanceRoutes };
