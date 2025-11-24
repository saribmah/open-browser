import { Hono } from "hono";
import { cors } from "hono/cors";
import { describeRoute, resolver, openAPIRouteHandler } from 'hono-openapi';
import { z } from "zod";
import { sandboxRoutes } from "./sandbox";
import { configRoutes } from "./config";

export namespace Api {
    export type Routes = ReturnType<typeof app>;

    function app() {
        const app = new Hono();

        app.onError((err, c) => {
            console.error("Request error", err.message);
            return c.json(
                {
                    error: "Internal Server Error",
                    message: err.message
                },
                { status: 500 }
            );
        });

        app
            .use(
                "*",
                cors({
                    origin: "*",
                    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                    allowHeaders: ["Content-Type", "Authorization"],
                    credentials: true,
                }),
            )
            .get(
                "/health",
                describeRoute({
                    description: 'Health Check',
                    responses: {
                        200: {
                            description: 'Service is healthy',
                            content: {
                                'application/json': { 
                                    schema: resolver(z.object({
                                        status: z.string(),
                                        timestamp: z.string()
                                    }))
                                },
                            },
                        },
                    },
                }),
                async (c) => {
                    return c.json({
                        status: "ok",
                        timestamp: new Date().toISOString()
                    });
                })
            .get(
                "/",
                describeRoute({
                    description: 'Service Information',
                    responses: {
                        200: {
                            description: 'Service details',
                            content: {
                                'application/json': { 
                                    schema: resolver(z.object({
                                        service: z.string(),
                                        version: z.string()
                                    }))
                                },
                            },
                        },
                    },
                }),
                async (c) => {
                    return c.json({
                        service: "open-browser",
                        version: "1.0.0"
                    });
                })
            .route("/sandbox", sandboxRoutes)
            .route("/config", configRoutes)
            .get(
                "/doc",
                openAPIRouteHandler(app, {
                    documentation: {
                        info: {
                            title: "Open Browser API",
                            version: "1.0.0",
                            description: "API documentation for Open Browser service",
                        },
                        openapi: "3.1.1",
                    },
                }),
            )

        return app;
    }

    export const routes = app();
}
