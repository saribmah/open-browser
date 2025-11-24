import {Hono} from "hono";
import {cors} from "hono/cors";
import {Log} from "../util/log";
import {sessionRoutes} from "./session.ts";
import {sdkRoutes} from "./sdk.ts";
import {instanceRoutes} from "./instance.ts";
import {configRoutes} from "./config.ts";
import {fileRoutes} from "./file.ts";
import { describeRoute, resolver, openAPIRouteHandler } from 'hono-openapi';
import { z } from "zod";

export namespace Router {
    const log = Log.create({ service: "server" });

    export type Routes = ReturnType<typeof app>;

    const HealthSchema = z.object({
        status: z.string(),
        timestamp: z.string()
    });

    const ServiceInfoSchema = z.object({
        service: z.string(),
        version: z.string()
    });

    function app() {
        const app = new Hono();

        app.onError((err, c) => {
            log.error("Request error", {
                error: err.message,
                stack: err.stack
            });
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
                    origin: [process.env["CORS_ORIGIN"] ?? "*"],
                    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                    allowHeaders: ["Content-Type", "Authorization"],
                    credentials: true,
                }),
            )
            .use(async (c, next) => {
                log.info("request", {
                    method: c.req.method,
                    path: c.req.path,
                });
                const start = Date.now();
                await next();
                log.info("response", {
                    duration: Date.now() - start,
                });
            })
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
                        service: "open-browser sandbox",
                        version: "1.0.0"
                    });
                })
            .route("/session", sessionRoutes)
            .route("/sdk", sdkRoutes)
            .route("/instance", instanceRoutes)
            .route("/config", configRoutes)
            .route("/file", fileRoutes)
            .get(
                "/doc",
                openAPIRouteHandler(app, {
                    documentation: {
                        info: {
                            title: "Open Browser Sandbox API",
                            version: "1.0.0",
                            description: "API documentation for Open Browser Sandbox service",
                        },
                        openapi: "3.1.1",
                    },
                }),
            )

        return app;
    }

    export function listen(opts: { port: number; hostname: string }) {
        return Bun.serve({
            port: opts.port,
            hostname: opts.hostname,
            idleTimeout: 0,
            fetch: app().fetch,
        });
    }

    export const routes = app();
}
