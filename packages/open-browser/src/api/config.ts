import { Hono } from "hono";
import { describeRoute, resolver } from 'hono-openapi';
import { ConfigResponseSchema, type ProviderConfig, type SandboxProvider, type SdkType } from "./schemas";

const route = new Hono();

// Define provider configurations
const PROVIDER_CONFIGS: ProviderConfig[] = [
    {
        name: "local" as SandboxProvider,
        version: "latest",
        sdks: ["OPENCODE" as SdkType],
        defaultSdk: "OPENCODE" as SdkType
    },
    {
        name: "docker" as SandboxProvider,
        version: "latest",
        sdks: ["OPENCODE" as SdkType],
        defaultSdk: "OPENCODE" as SdkType
    },
    {
        name: "cloudflare" as SandboxProvider,
        version: "1.0.0",
        sdks: ["OPENCODE" as SdkType],
        defaultSdk: "OPENCODE" as SdkType
    },
    {
        name: "daytona" as SandboxProvider,
        version: "0.1.0",
        sdks: ["OPENCODE" as SdkType],
        defaultSdk: "OPENCODE" as SdkType
    },
    {
        name: "vercel" as SandboxProvider,
        version: "1.0.0",
        sdks: ["OPENCODE" as SdkType],
        defaultSdk: "OPENCODE" as SdkType
    }
];

const DEFAULT_PROVIDER: SandboxProvider = "local";

// GET /config - Get configuration for web client
route.get(
    "/",
    describeRoute({
        description: 'Get Configuration',
        responses: {
            200: {
                description: 'Configuration retrieved successfully',
                content: {
                    'application/json': { schema: resolver(ConfigResponseSchema) },
                },
            },
        },
    }),
    async (c) => {
        return c.json({
            providers: PROVIDER_CONFIGS,
            defaultProvider: DEFAULT_PROVIDER
        });
    },
);

export { route as configRoutes };
