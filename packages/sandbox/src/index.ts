import { Router } from "./router/router.ts";
import { Log } from "./util/log.ts";

const log = Log.create({ service: "main" });
const port = Number(process.env["SERVER_PORT"] || 3097);
const hostname = "0.0.0.0";

// Global error handlers to prevent server crashes
process.on("uncaughtException", (error) => {
    log.error("Uncaught Exception", { error: error.message, stack: error.stack });
    // Don't exit - keep server running
});

process.on("unhandledRejection", (reason, promise) => {
    log.error("Unhandled Promise Rejection", { reason, promise: String(promise) });
    // Don't exit - keep server running
});

log.info(`AI Server starting`, { hostname, port });
const server = Router.listen({
    port,
    hostname,
});

log.info("Server listening", { url: `http://${server.hostname}:${server.port}` });

await new Promise(() => {});

server.stop();

log.info("AI Server successfully started", { hostname, port });
