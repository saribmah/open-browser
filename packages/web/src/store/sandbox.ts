import { create } from 'zustand';
import { postSandbox } from '@/client/api/sdk.gen';
import { client } from '@/client/api/client.gen';
import type { PostSandboxResponses } from '@/client/api/types.gen';

export type SandboxProvider = 'cloudflare' | 'daytona' | 'vercel';
export type IntegrationType = 'GITHUB' | 'ARXIV';
export type SdkType = 'OPENCODE' | 'CLAUDE_CODE';
export type SandboxStatus = 'pending' | 'running' | 'stopped' | 'error';

export interface Sandbox {
    id: string;
    provider: SandboxProvider;
    status: SandboxStatus;
    url?: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
}

export interface CreateSandboxParams {
    url: string;
    type: IntegrationType;
    directory: string;
    sdkType: SdkType;
    provider: SandboxProvider;
}

interface SandboxState {
    sandbox: Sandbox | null;
    isCreating: boolean;
    error: string | null;
    
    createSandbox: (params: CreateSandboxParams) => Promise<Sandbox | null>;
    reset: () => void;
}

// Configure the API client base URL
client.setConfig({
    baseUrl: '/api',
});

export const useSandboxStore = create<SandboxState>((set) => ({
    sandbox: null,
    isCreating: false,
    error: null,

    createSandbox: async (params) => {
        set({ isCreating: true, error: null });

        try {
            const result = await postSandbox({
                body: params,
            });

            if (result.error) {
                const errorMsg = (result.error as { error?: string })?.error || 'Failed to create sandbox';
                set({ error: errorMsg, isCreating: false });
                return null;
            }

            const data = result.data as PostSandboxResponses[200];
            if (data?.sandbox) {
                set({ sandbox: data.sandbox, isCreating: false });
                return data.sandbox;
            }

            set({ error: 'No sandbox returned', isCreating: false });
            return null;
        } catch (err: any) {
            set({ error: err.message || 'Failed to create sandbox', isCreating: false });
            return null;
        }
    },

    reset: () => {
        set({ sandbox: null, isCreating: false, error: null });
    },
}));
