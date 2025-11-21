import { CloudflareSandbox } from "./cloudflare";
import { DaytonaSandbox } from "./daytona";
import { VercelSandbox } from "./vercel";

export type SandboxProvider = "cloudflare" | "daytona" | "vercel";
export type IntegrationType = "GITHUB" | "ARXIV";
export type SdkType = "OPENCODE" | "CLAUDE_CODE";

export interface SandboxConfig {
    url: string;
    type: IntegrationType;
    directory: string;
    sdkType: SdkType;
    provider: SandboxProvider;
}

export interface SandboxSession {
    id: string;
    provider: SandboxProvider;
    status: "pending" | "provisioning" | "cloning" | "starting" | "ready" | "error" | "terminated";
    url: string | null;
    createdAt: string;
    config: SandboxConfig;
    errorMessage?: string;
}

export interface SandboxProviderInterface {
    create(config: SandboxConfig): Promise<SandboxSession>;
}

export class SandboxManager {
    private static getProvider(provider: SandboxProvider): SandboxProviderInterface {
        switch (provider) {
            case "cloudflare":
                return new CloudflareSandbox();
            case "daytona":
                return new DaytonaSandbox();
            case "vercel":
                return new VercelSandbox();
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    static async create(config: SandboxConfig): Promise<SandboxSession> {
        const provider = this.getProvider(config.provider);
        return provider.create(config);
    }
}
