import { Router } from "./router/router.ts";
import { Log } from "./util/log.ts";
import { Instance } from "./instance/instance.ts";

const log = Log.create({ service: "main" });
const port = Number(process.env["SERVER_PORT"] || 3097);
const hostname = "0.0.0.0";

// Cleanup function to be called on shutdown
async function shutdown(signal: string) {
    log.info(`Received ${signal}, starting graceful shutdown`);

    try {
        // Cleanup all instances
        await Instance.cleanup();

        log.info("Graceful shutdown completed");
        process.exit(0);
    } catch (error: any) {
        log.error("Error during shutdown", { error: error.message });
        process.exit(1);
    }
}

// Register shutdown handlers
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

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
