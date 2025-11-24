import { Integration } from "./integration";
import { $ } from "bun";
import { Log } from "../util/log";

const log = Log.create({ service: "github-integration" });

/**
 * GitHub integration configuration
 */
export const GITHUB: Integration.Config = {
    type: "GITHUB",
    urlPattern: /github\.com\/([^\/]+)\/([^\/]+)/,
    parseUrl: (url: string) => {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return null;
        const [, owner, repo] = match;
        return {
            id: `github-${owner}-${repo}`,
            metadata: {
                owner,
                repo
            }
        };
    },
    setup: async (opts) => {
        const { url, directory, metadata } = opts;

        log.info("Setting up GitHub repository", {
            url,
            directory,
            owner: metadata?.owner,
            repo: metadata?.repo
        });

        try {
            // Clone repository with depth 1 (shallow clone)
            await $`git clone --depth 1 ${url} ${directory}`.quiet();

            log.info("GitHub repository cloned successfully", {
                directory,
                url
            });
        } catch (error: any) {
            console.log(error)
            log.error("Failed to clone GitHub repository", {
                error: error.message,
                url,
                directory
            });
            throw new Error(`Failed to clone GitHub repository: ${error.message}`);
        }
    },
    remove: async (opts) => {
        const { directory, metadata } = opts;

        log.info("Removing GitHub repository", {
            directory,
            owner: metadata?.owner,
            repo: metadata?.repo
        });

        try {
            // Remove the directory
            await $`rm -rf ${directory}`.quiet();

            log.info("GitHub repository removed successfully", {
                directory
            });
        } catch (error: any) {
            log.error("Failed to remove GitHub repository", {
                error: error.message,
                directory
            });
            throw new Error(`Failed to remove GitHub repository: ${error.message}`);
        }
    }
};
