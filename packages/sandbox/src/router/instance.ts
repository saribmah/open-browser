import { Hono } from "hono";
import { Instance } from "../instance/instance";
import { Project } from "../instance/project";
import { describeRoute, resolver, validator } from 'hono-openapi'
import {z} from "zod";

const ProjectSchema = z.object({
    id: z.string(),
    type: z.enum(["GITHUB", "ARXIV"]),
    url: z.string(),
    directory: z.string(),
    metadata: z.record(z.string(), z.any()).optional()
});

const InstanceStateSchema = z.object({
    sdkType: z.enum(["OPENCODE", "CLAUDE_CODE"])
});

const ProjectStateSchema = z.object({
    currentProject: ProjectSchema.nullable(),
    projects: z.array(ProjectSchema)
});

const InitInstanceSchema = z.object({
    sdkType: z.enum(["OPENCODE", "CLAUDE_CODE"])
});

const AddProjectSchema = z.object({
    url: z.string(),
    type: z.enum(["GITHUB", "ARXIV"]),
    directory: z.string()
});

const SwitchProjectSchema = z.object({
    projectId: z.string()
});

const RemoveProjectSchema = z.object({
    projectId: z.string()
});

const ErrorSchema = z.object({
    error: z.string()
});

const SuccessSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    project: ProjectSchema.optional()
});

const route = new Hono();

// POST /instance/init - Initialize the SDK (call this once at startup)
route.post(
    "/init",
    describeRoute({
        description: 'Initialize SDK',
        responses: {
            200: {
                description: 'SDK initialized successfully',
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
    validator('json', InitInstanceSchema),
    async (c) => {
        const body = await c.req.json();
        const { sdkType } = body;

        if (!sdkType) {
            return c.json({
                error: "sdkType is required (OPENCODE or CLAUDE_CODE)"
            }, 400);
        }

        try {
            await Instance.init({ sdkType });
            return c.json({
                success: true,
                message: "SDK initialized successfully"
            });
        } catch (error: any) {
            return c.json({
                error: error.message
            }, 400);
        }
    });

// GET /instance/state - Get the current instance state (SDK type + all projects)
route.get(
    "/state",
    describeRoute({
        description: 'Get Instance State',
        responses: {
            200: {
                description: 'Instance state retrieved successfully',
                content: {
                    'application/json': { schema: resolver(InstanceStateSchema) },
                },
            },
        },
    }),
    async (c) => {
        const state = Instance.getState();
        return c.json(state);
    });

// GET /instance/current - Get the current active project
route.get(
    "/current",
    describeRoute({
        description: 'Get Current Project',
        responses: {
            200: {
                description: 'Current project retrieved successfully',
                content: {
                    'application/json': { schema: resolver(ProjectSchema) },
                },
            },
            404: {
                description: 'No current project set',
                content: {
                    'application/json': { schema: resolver(ErrorSchema) },
                },
            },
        },
    }),
    async (c) => {
        const current = Project.getCurrent();

        if (!current) {
            return c.json({
                error: "No current project set"
            }, 404);
        }

        return c.json(current);
    });

// GET /instance/projects - Get all projects
route.get(
    "/projects",
    describeRoute({
        description: 'Get All Projects',
        responses: {
            200: {
                description: 'Projects retrieved successfully',
                content: {
                    'application/json': { 
                        schema: resolver(z.array(ProjectSchema)) 
                    },
                },
            },
        },
    }),
    async (c) => {
        const projects = Project.getAll();
        return c.json(projects);
    });

// POST /instance/project/add - Add a new project
route.post(
    "/project/add",
    describeRoute({
        description: 'Add New Project',
        responses: {
            200: {
                description: 'Project added successfully',
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
    validator('json', AddProjectSchema),
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

        // Check if SDK is initialized
        if (!Instance.isInitialized()) {
            return c.json({
                error: "SDK not initialized. Call /instance/init first"
            }, 400);
        }

        const result = await Project.add({ url, type, directory });

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to add project"
            }, 400);
        }

        return c.json({
            success: true,
            message: "Project added successfully",
            project: result.project
        });
    });

// POST /instance/project/switch - Switch to a different project
route.post(
    "/project/switch",
    describeRoute({
        description: 'Switch to Different Project',
        responses: {
            200: {
                description: 'Project switched successfully',
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
    validator('json', SwitchProjectSchema),
    async (c) => {
        const body = await c.req.json();
        const { projectId } = body;

        if (!projectId) {
            return c.json({
                error: "projectId is required"
            }, 400);
        }

        const result = Project.switchTo(projectId);

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to switch project"
            }, 400);
        }

        return c.json({
            success: true,
            message: "Project switched successfully",
            project: result.project
        });
    });

// POST /instance/project/remove - Remove a project
route.post(
    "/project/remove",
    describeRoute({
        description: 'Remove Project',
        responses: {
            200: {
                description: 'Project removed successfully',
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
    validator('json', RemoveProjectSchema),
    async (c) => {
        const body = await c.req.json();
        const { projectId } = body;

        if (!projectId) {
            return c.json({
                error: "projectId is required"
            }, 400);
        }

        const result = await Project.remove(projectId);

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to remove project"
            }, 400);
        }

        return c.json({
            success: true,
            message: "Project removed successfully"
        });
    });

export { route as instanceRoutes };
