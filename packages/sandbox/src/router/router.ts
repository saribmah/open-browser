import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { Log } from "../util/log";

export namespace Router {
    const log = Log.create({ service: "server" });

    export type Routes = ReturnType<typeof app>;

    function app() {
        const app = new Hono();

        const result = app.onError((err, c) => {
            if (err instanceof NamedError) {
                return c.json(err.toObject(), {
                    status: 400,
                });
            }
            return c.json(
                new NamedError.Unknown({ message: err.toString() }).toObject(),
                {
                    status: 400,
                },
            );
        });
        app
            .use(
                "*",
                cors({
                    origin: [process.env["CORS_ORIGIN"] ?? "*"],
                    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                    allowHeaders: ["Content-Type", "Authorization", "X-VIE-USER-TOKEN"],
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
                    description: "Get health",
                    responses: {
                        200: {
                            description: "200",
                            content: {
                                "application/json": {
                                    schema: resolver(z.boolean()),
                                },
                            },
                        },
                    },
                }),
                async (c) => {
                    return c.json(true);
                },
            )
            .get(
                "/mode",
                describeRoute({
                    description: "List all modes",
                    responses: {
                        200: {
                            description: "List of modes",
                            content: {
                                "application/json": {
                                    schema: resolver(Mode.Info.array()),
                                },
                            },
                        },
                    },
                }),
                async (c) => {
                    const modes = await Mode.list();
                    return c.json(modes);
                },
            )

        return result;
    }

    export function listen(opts: { port: number; hostname: string }) {
        const server = Bun.serve({
            port: opts.port,
            hostname: opts.hostname,
            idleTimeout: 0,
            fetch: app().fetch,
        });
        return server;
    }
}
