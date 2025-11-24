import { Hono } from "hono";
import { describeRoute, resolver } from 'hono-openapi';
import { ConfigResponseSchema, type ProviderConfig, type SandboxProvider, type SdkType } from "./schemas";

const route = new Hono();

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
        // Define provider configurations
        const env = c.env as Cloudflare.Env;
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
                version: env.DAYTONA_IMAGE_TAG,
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
        return c.json({
            providers: PROVIDER_CONFIGS,
            defaultProvider: DEFAULT_PROVIDER
        });
    },
);

export { route as configRoutes };
