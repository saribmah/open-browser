import {Hono} from "hono";
import {cors} from "hono/cors";
import {Log} from "../util/log";
import {sessionRoutes} from "./session.ts";

export namespace Router {
    const log = Log.create({ service: "server" });

    export type Routes = ReturnType<typeof app>;

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
                    origin: process.env["CORS_ORIGIN"] ?? "*",
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
            .get("/health", async (c) => {
                return c.json({
                    status: "ok",
                    timestamp: new Date().toISOString()
                });
            })
            .get("/", async (c) => {
                return c.json({
                    service: "open-browser sandbox",
                    version: "1.0.0"
                });
            })
            .route("/session", sessionRoutes)

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
}
