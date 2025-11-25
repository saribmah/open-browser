import { Hono } from "hono";
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from "zod";
import { File } from "../file/file";

const route = new Hono();

const ErrorSchema = z.object({
    error: z.string()
});

const FileInfoSchema = z.object({
    name: z.string(),
    path: z.string(),
    type: z.enum(["file", "directory"]),
    size: z.number().optional(),
    modifiedAt: z.string().optional()
});

// Define FileTree schema - use FileInfoSchema for children to avoid recursion issues
const FileTreeItemSchema = z.object({
    name: z.string(),
    path: z.string(),
    type: z.enum(["file", "directory"]),
    children: z.array(FileInfoSchema).optional(),
    size: z.number().optional(),
    modifiedAt: z.string().optional()
});

const ListFilesResponseSchema = z.object({
    files: z.array(FileInfoSchema)
});

const FileTreeResponseSchema = z.object({
    tree: FileTreeItemSchema
});

const FileContentResponseSchema = z.object({
    content: z.string()
});

const ListQuerySchema = z.object({
    path: z.string().optional().default(".")
});

const TreeQuerySchema = z.object({
    path: z.string().optional().default("."),
    maxDepth: z.string().optional().transform(val => val ? parseInt(val) : 3)
});

const ReadQuerySchema = z.object({
    path: z.string()
});

// GET /file/list - List files in a directory
route.get(
    "/list",
    describeRoute({
        description: 'List Files in Directory',
        responses: {
            200: {
                description: 'Files retrieved successfully',
                content: {
                    'application/json': { schema: resolver(ListFilesResponseSchema) },
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
    validator('query', ListQuerySchema),
    async (c) => {
        const { path } = c.req.valid('query');
        const result = await File.list(path);

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to list files"
            }, 400);
        }

        return c.json({
            files: result.files || []
        });
    },
);

// GET /file/tree - Get file tree structure
route.get(
    "/tree",
    describeRoute({
        description: 'Get File Tree Structure',
        responses: {
            200: {
                description: 'File tree retrieved successfully',
                content: {
                    'application/json': { schema: resolver(FileTreeResponseSchema) },
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
    validator('query', TreeQuerySchema),
    async (c) => {
        const { path, maxDepth } = c.req.valid('query');
        const result = await File.tree(path, maxDepth);

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to get file tree"
            }, 400);
        }

        return c.json({
            tree: result.tree
        });
    },
);

// GET /file/read - Read file content
route.get(
    "/read",
    describeRoute({
        description: 'Read File Content',
        responses: {
            200: {
                description: 'File content retrieved successfully',
                content: {
                    'application/json': { schema: resolver(FileContentResponseSchema) },
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
    validator('query', ReadQuerySchema),
    async (c) => {
        const { path } = c.req.valid('query');
        const result = await File.read(path);

        if (!result.success) {
            return c.json({
                error: result.error || "Failed to read file"
            }, 400);
        }

        return c.json({
            content: result.content || ""
        });
    },
);

// GET /file/raw - Get raw file content (for binary files like PDFs)
route.get(
    "/raw",
    describeRoute({
        description: 'Get Raw File Content',
        responses: {
            200: {
                description: 'Raw file content retrieved successfully',
                content: {
                    'application/octet-stream': {
                        schema: {
                            type: 'string',
                            format: 'binary'
                        }
                    },
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
    validator('query', ReadQuerySchema),
    async (c) => {
        const { path } = c.req.valid('query');
        const result = await File.raw(path);

        if (!result.success || !result.buffer) {
            return c.json({
                error: result.error || "Failed to read file"
            }, 400);
        }

        // Set appropriate headers and return raw binary content
        c.header('Content-Type', result.mimeType || 'application/octet-stream');
        c.header('Content-Length', result.buffer.length.toString());
        c.header('Content-Disposition', `inline; filename="${path.split('/').pop()}"`);
        
        return new Response(result.buffer, {
            headers: c.res.headers
        });
    },
);

export { route as fileRoutes };
