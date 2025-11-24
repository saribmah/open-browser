import { DurableObject } from "cloudflare:workers";
import { CloudflareSandbox } from "./cloudflare";
import { DaytonaSandbox } from "./daytona";
import { VercelSandbox } from "./vercel";
import { DockerSandbox } from "./docker";
import { LocalSandbox } from "./local";

export type SandboxProvider = "cloudflare" | "daytona" | "vercel" | "docker" | "local";
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

export class SandboxManager extends DurableObject {
    private sql: SqlStorage;

    constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
        super(ctx, env);
        this.sql = ctx.storage.sql;
        this.initDatabase();
    }

    private initDatabase() {
        this.sql.exec(`
            CREATE TABLE IF NOT EXISTS sandboxes (
                id TEXT PRIMARY KEY,
                provider TEXT NOT NULL,
                status TEXT NOT NULL,
                url TEXT,
                created_at TEXT NOT NULL,
                config TEXT NOT NULL,
                error_message TEXT
            )
        `);
    }

    private getProviderInstance(provider: SandboxProvider): SandboxProviderInterface {
        switch (provider) {
            case "cloudflare":
                return new CloudflareSandbox(this.env);
            case "daytona":
                return new DaytonaSandbox(this.env);
            case "vercel":
                return new VercelSandbox();
            case "docker":
                return new DockerSandbox();
            case "local":
                return new LocalSandbox();
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    async create(config: SandboxConfig): Promise<SandboxSession> {
        const providerInstance = this.getProviderInstance(config.provider);
        const session = await providerInstance.create(config);

        this.sql.exec(
            `INSERT INTO sandboxes (id, provider, status, url, created_at, config, error_message)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            session.id,
            session.provider,
            session.status,
            session.url,
            session.createdAt,
            JSON.stringify(session.config),
            session.errorMessage || null
        );

        return session;
    }

    async get(id: string): Promise<SandboxSession | null> {
        const cursor = this.sql.exec(
            `SELECT id, provider, status, url, created_at, config, error_message 
             FROM sandboxes WHERE id = ?`,
            id
        );
        const rows = [...cursor];
        if (rows.length === 0) return null;

        const row = rows[0] as any;
        return {
            id: row.id,
            provider: row.provider as SandboxProvider,
            status: row.status,
            url: row.url,
            createdAt: row.created_at,
            config: JSON.parse(row.config),
            errorMessage: row.error_message || undefined
        };
    }

    async list(): Promise<SandboxSession[]> {
        const cursor = this.sql.exec(
            `SELECT id, provider, status, url, created_at, config, error_message 
             FROM sandboxes ORDER BY created_at DESC`
        );
        return [...cursor].map((row: any) => ({
            id: row.id,
            provider: row.provider as SandboxProvider,
            status: row.status,
            url: row.url,
            createdAt: row.created_at,
            config: JSON.parse(row.config),
            errorMessage: row.error_message || undefined
        }));
    }

    async delete(id: string): Promise<boolean> {
        const existing = await this.get(id);
        if (!existing) return false;

        this.sql.exec(`DELETE FROM sandboxes WHERE id = ?`, id);
        return true;
    }

    async updateStatus(id: string, status: SandboxSession["status"], errorMessage?: string): Promise<boolean> {
        const existing = await this.get(id);
        if (!existing) return false;

        this.sql.exec(
            `UPDATE sandboxes SET status = ?, error_message = ? WHERE id = ?`,
            status,
            errorMessage || null,
            id
        );
        return true;
    }
}
