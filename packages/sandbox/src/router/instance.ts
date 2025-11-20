import { Hono } from "hono";
import { Instance } from "../instance/instance";

const route = new Hono();

// GET /instance/current - Get the current active instance
route.get("/current", async (c) => {
    const current = Instance.getCurrent();
    
    if (!current) {
        return c.json({ 
            error: "No current instance set" 
        }, 404);
    }
    
    return c.json(current);
});

// GET /instance/available - Get all available instances (excluding current)
route.get("/available", async (c) => {
    const available = Instance.getAvailable();
    return c.json(available);
});

// POST /instance/add - Add a new instance to available instances
route.post("/add", async (c) => {
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
    
    try {
        await Instance.add({ url, type, directory });
        return c.json({ 
            success: true,
            message: "Instance added and setup completed",
            directory
        });
    } catch (error: any) {
        return c.json({ 
            error: error.message 
        }, 400);
    }
});

// POST /instance/switch - Switch to a different instance
route.post("/switch", async (c) => {
    const body = await c.req.json();
    const { instanceId } = body;
    
    if (!instanceId) {
        return c.json({ 
            error: "instanceId is required" 
        }, 400);
    }
    
    const result = Instance.switchTo(instanceId);
    
    if (!result.success) {
        return c.json({ 
            error: result.error 
        }, 400);
    }
    
    return c.json({ 
        success: true, 
        instance: result.instance 
    });
});

export { route as instanceRoutes };
