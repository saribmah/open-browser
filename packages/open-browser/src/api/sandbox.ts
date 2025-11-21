import { Hono } from "hono";
import { describeRoute, resolver, validator } from 'hono-openapi';
import type { SandboxManager } from "../sandbox/manager";
import {
    ErrorSchema,
    SandboxSchema,
    CreateSandboxSchema,
    SandboxesResponseSchema,
    SuccessSchema
} from "./schemas";

const route = new Hono<{ Bindings: Cloudflare.Env }>();

function getSandboxManager(env: Cloudflare.Env): DurableObjectStub<SandboxManager> {
    const id = env.SANDBOX_MANAGER.idFromName("global");
    return env.SANDBOX_MANAGER.get(id);
}

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
        const manager = getSandboxManager(c.env);
        const sandboxes = await manager.list();
        return c.json({
            sandboxes: sandboxes.map(s => ({
                id: s.id,
                provider: s.provider,
                status: s.status,
                url: s.url,
                createdAt: s.createdAt,
                metadata: s.config
            }))
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
            const manager = getSandboxManager(c.env);
            const session = await manager.create({
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
        const manager = getSandboxManager(c.env);
        const sandbox = await manager.get(id);
        
        if (!sandbox) {
            return c.json({ error: `Sandbox ${id} not found` }, 404);
        }

        return c.json({
            id: sandbox.id,
            provider: sandbox.provider,
            status: sandbox.status,
            url: sandbox.url,
            createdAt: sandbox.createdAt,
            metadata: sandbox.config
        });
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
        const manager = getSandboxManager(c.env);
        const deleted = await manager.delete(id);
        
        if (!deleted) {
            return c.json({ error: `Sandbox ${id} not found` }, 404);
        }

        return c.json({
            success: true,
            message: `Sandbox ${id} deleted`
        });
    },
);

export { route as sandboxRoutes };
