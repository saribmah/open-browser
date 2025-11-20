import { $ } from "bun";
import { Log } from "../util/log";
import path from "path";

const log = Log.create({ service: "claude-code-sdk" });

/**
 * Claude Code SDK configuration
 */
export const CLAUDE_CODE = {
    type: "CLAUDE_CODE" as const,
    name: "Claude Code",
    setup: async (opts: { directory: string; metadata?: Record<string, any> }) => {
        const { directory, metadata } = opts;
        
        log.info("Setting up Claude Code SDK", { 
            directory,
            metadata
        });

        try {
            const configPath = path.join(directory, ".claude");
            
            // Create .claude directory if it doesn't exist
            await $`mkdir -p ${configPath}`.quiet();
            
            // Create a default config file
            const config = {
                model: "claude-3-5-sonnet-20241022",
                ...metadata
            };
            
            const configFile = path.join(configPath, "config.json");
            await Bun.write(configFile, JSON.stringify(config, null, 2));
            
            log.info("Claude Code SDK setup completed", { 
                directory,
                configPath
            });
        } catch (error: any) {
            log.error("Failed to setup Claude Code SDK", { 
                error: error.message,
                directory
            });
            throw new Error(`Failed to setup Claude Code SDK: ${error.message}`);
        }
    },
    remove: async (opts: { directory: string; metadata?: Record<string, any> }) => {
        const { directory, metadata } = opts;
        
        log.info("Removing Claude Code SDK", { 
            directory,
            metadata
        });

        try {
            const configPath = path.join(directory, ".claude");
            
            // Remove .claude directory
            await $`rm -rf ${configPath}`.quiet();
            
            log.info("Claude Code SDK removed successfully", { 
                directory
            });
        } catch (error: any) {
            log.error("Failed to remove Claude Code SDK", { 
                error: error.message,
                directory
            });
            throw new Error(`Failed to remove Claude Code SDK: ${error.message}`);
        }
    }
};
