import {createOpencode} from "@opencode-ai/sdk";

export const opencode = await createOpencode({
    hostname: "127.0.0.1",
    port: 4096,
    config: {
        model: "anthropic/claude-3-5-sonnet-20241022",
    },
});
