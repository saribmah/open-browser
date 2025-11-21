import { Hono } from "hono";
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from "zod";
import { SandboxManager } from "../sandbox/manager";

const route = new Hono();

const ErrorSchema = z.object({
    error: z.string()
});

const SandboxSchema = z.object({
    id: z.string(),
    provider: z.enum(["cloudflare", "daytona", "vercel"]),
    status: z.enum(["pending", "running", "stopped", "error"]),
    url: z.string().optional(),
    createdAt: z.string(),
    metadata: z.record(z.string(), z.any()).optional()
});

const CreateSandboxSchema = z.object({
    url: z.string(),
    type: z.enum(["GITHUB", "ARXIV"]),
    directory: z.string(),
    sdkType: z.enum(["OPENCODE", "CLAUDE_CODE"]),
    provider: z.enum(["cloudflare", "daytona", "vercel"])
});

const SandboxesResponseSchema = z.object({
    sandboxes: z.array(SandboxSchema)
});

const SuccessSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    sandbox: SandboxSchema.optional()
});

// GET /sandbox - Get all sandboxes
route.get(
    "/",
    describeRoute({
        description: 'Get All Sandboxes',
        responses: {
            200: {
                description: 'Sandboxes retrieved successfully',
                content: {
                    'application/json': { schema: resolver(SandboxesResponseSchema) },
                },
            },
        },
    }),
    async (c) => {
        // TODO: Implement sandbox listing
        return c.json({
            sandboxes: []
        });
    },
);

// POST /sandbox - Create a new sandbox
route.post(
    "/",
    describeRoute({
        description: 'Create New Sandbox',
        responses: {
            200: {
                description: 'Sandbox created successfully',
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
    validator('json', CreateSandboxSchema),
    async (c) => {
        const body = await c.req.json();
        const { url, type, directory, sdkType, provider } = body;

        try {
            const session = await SandboxManager.create({
                url,
                type,
                directory,
                sdkType,
                provider
            });

            return c.json({
                success: true,
                sandbox: {
                    id: session.id,
                    provider: session.provider,
                    status: session.status,
                    url: session.url,
                    createdAt: session.createdAt,
                    metadata: session.config
                }
            });
        } catch (error: any) {
            return c.json({
                error: error.message || "Failed to create sandbox"
            }, 400);
        }
    },
);

// GET /sandbox/:id - Get a specific sandbox
route.get(
    "/:id",
    describeRoute({
        description: 'Get Sandbox by ID',
        responses: {
            200: {
                description: 'Sandbox retrieved successfully',
                content: {
                    'application/json': { schema: resolver(SandboxSchema) },
                },
            },
            404: {
                description: 'Sandbox not found',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
        },
    }),
    async (c) => {
        const id = c.req.param('id');
        
        // TODO: Implement sandbox retrieval
        return c.json({
            error: `Sandbox ${id} not found`
        }, 404);
    },
);

// DELETE /sandbox/:id - Delete a sandbox
route.delete(
    "/:id",
    describeRoute({
        description: 'Delete Sandbox',
        responses: {
            200: {
                description: 'Sandbox deleted successfully',
                content: {
                    'application/json': { schema: resolver(SuccessSchema) },
                },
            },
            404: {
                description: 'Sandbox not found',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
        },
    }),
    async (c) => {
        const id = c.req.param('id');
        
        // TODO: Implement sandbox deletion
        return c.json({
            success: true,
            message: `Sandbox ${id} deletion not yet implemented`
        });
    },
);

export { route as sandboxRoutes };
