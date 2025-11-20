import { Hono } from "hono";

const route = new Hono();

interface SDK {
    id: string;
    name: string;
    description: string;
    version: string;
}

const availableSDKs: SDK[] = [
    {
        id: "opencode",
        name: "OpenCode",
        description: "AI-powered coding assistant SDK",
        version: "1.0.80"
    }
];

route.get("/", async (c) => {
    return c.json(availableSDKs);
});

export { route as sdkRoutes };
