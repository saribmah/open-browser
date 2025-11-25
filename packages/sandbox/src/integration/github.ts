import { Integration } from "./integration";
import { $ } from "bun";
import { Log } from "../util/log";

const log = Log.create({ service: "github-integration" });

/**
 * Parse GitHub URL to extract owner, repo, and optional branch
 * Supports URLs like:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch-name
 */
function parseGitHubUrl(url: string): { owner: string; repo: string; branch?: string } | null {
    // Match URLs with optional /tree/branch-name
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/tree\/(.+))?$/);
    if (!match) return null;
    
    const [, owner, repo, branch] = match;
    if (!owner || !repo) return null;
    
    return {
        owner,
        repo: repo.replace(/\.git$/, ''), // Remove .git suffix if present
        branch: branch || undefined
    };
}

/**
 * Build the git clone URL from owner and repo
 */
function buildCloneUrl(owner: string, repo: string): string {
    return `https://github.com/${owner}/${repo}.git`;
}

/**
 * GitHub integration configuration
 */
export const GITHUB: Integration.Config = {
    type: "GITHUB",
    urlPattern: /github\.com\/([^\/]+)\/([^\/]+)/,
    parseUrl: (url: string) => {
        const parsed = parseGitHubUrl(url);
        if (!parsed) return null;
        
        const { owner, repo, branch } = parsed;
        return {
            id: `github-${owner}-${repo}`,
            metadata: {
                owner,
                repo,
                branch
            }
        };
    },
    setup: async (opts) => {
        const { url, directory, metadata } = opts;
        
        // Parse the URL to get owner, repo, and branch
        const parsed = parseGitHubUrl(url);
        if (!parsed) {
            throw new Error(`Invalid GitHub URL: ${url}`);
        }
        
        const { owner, repo, branch } = parsed;
        const cloneUrl = buildCloneUrl(owner, repo);

        log.info("Setting up GitHub repository", {
            url,
            cloneUrl,
            directory,
            owner,
            repo,
            branch
        });

        try {
            // Clone repository with depth 1 (shallow clone)
            // If branch is specified, use -b flag
            if (branch) {
                await $`git clone --depth 1 -b ${branch} ${cloneUrl} ${directory}`.quiet();
            } else {
                await $`git clone --depth 1 ${cloneUrl} ${directory}`.quiet();
            }

            log.info("GitHub repository cloned successfully", {
                directory,
                cloneUrl,
                branch
            });
        } catch (error: any) {
            console.log(error)
            log.error("Failed to clone GitHub repository", {
                error: error.message,
                url,
                cloneUrl,
                directory,
                branch
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
