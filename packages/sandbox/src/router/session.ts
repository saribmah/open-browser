import { Hono } from "hono";

const route = new Hono();

route
    .get(
        "/",
        async (c) => {
            return c.json({ error: "Session not found" }, 404);
        },
    );

export { route as sessionRoutes };
