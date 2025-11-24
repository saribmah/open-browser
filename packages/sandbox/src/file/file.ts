import { Log } from "../util/log";
import { Instance } from "../instance/instance";
import * as fs from "fs/promises";
import * as path from "path";

const log = Log.create({ service: "file" });

export namespace File {
    export interface FileInfo {
        name: string;
        path: string;
        type: "file" | "directory";
        size?: number;
        modifiedAt?: string;
    }

    export interface FileTree {
        name: string;
        path: string;
        type: "file" | "directory";
        children?: FileTree[];
        size?: number;
        modifiedAt?: string;
    }

    /**
     * List files in a directory
     */
    export async function list(dirPath: string = "."): Promise<{ success: boolean; files?: FileInfo[]; error?: string }> {
        log.info("Listing files", { dirPath });

        try {
            // Get instance directory
            const basePath = Instance.getDirectory();
            const fullPath = path.join(basePath, dirPath);

            log.info("Reading directory", {
                basePath,
                fullPath
            });

            // Check if path exists and is accessible
            try {
                await fs.access(fullPath);
            } catch {
                return {
                    success: false,
                    error: `Path not found or inaccessible: ${dirPath}`
                };
            }

            // Read directory contents
            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            const files: FileInfo[] = [];

            for (const entry of entries) {
                const entryPath = path.join(fullPath, entry.name);
                const stats = await fs.stat(entryPath);
                const relativePath = path.join(dirPath, entry.name);

                files.push({
                    name: entry.name,
                    path: relativePath,
                    type: entry.isDirectory() ? "directory" : "file",
                    size: entry.isFile() ? stats.size : undefined,
                    modifiedAt: stats.mtime.toISOString()
                });
            }

            log.info("Files listed successfully", {
                count: files.length
            });

            return {
                success: true,
                files
            };
        } catch (error: any) {
            log.error("Failed to list files", {
                error: error.message,
                dirPath
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get file tree (recursive directory structure)
     */
    export async function tree(dirPath: string = ".", maxDepth: number = 3): Promise<{ success: boolean; tree?: FileTree; error?: string }> {
        log.info("Getting file tree", { dirPath, maxDepth });

        try {
            // Get instance directory
            const basePath = Instance.getDirectory();
            const fullPath = path.join(basePath, dirPath);

            log.info("Building file tree", {
                basePath,
                fullPath,
                maxDepth
            });

            // Check if directory exists
            try {
                const stats = await fs.stat(fullPath);
                if (!stats.isDirectory()) {
                    log.warn("Path is not a directory, returning empty tree", { fullPath });
                    return {
                        success: true,
                        tree: {
                            name: path.basename(fullPath),
                            path: dirPath,
                            type: "directory",
                            children: []
                        }
                    };
                }
            } catch (error) {
                // Directory doesn't exist, return empty tree
                log.warn("Directory does not exist, returning empty tree", { 
                    fullPath,
                    error: (error as Error).message 
                });
                return {
                    success: true,
                    tree: {
                        name: path.basename(fullPath),
                        path: dirPath,
                        type: "directory",
                        children: []
                    }
                };
            }

            // Build tree starting from depth -1 so the requested directory itself is at depth 0
            // This way its children will be included
            const tree = await buildTree(fullPath, ".", -1, maxDepth);

            log.info("File tree built successfully");

            return {
                success: true,
                tree
            };
        } catch (error: any) {
            log.error("Failed to build file tree", {
                error: error.message,
                dirPath
            });
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Helper function to recursively build file tree
     */
    async function buildTree(fullPath: string, relativePath: string, depth: number, maxDepth: number): Promise<FileTree> {
        const stats = await fs.stat(fullPath);
        const name = path.basename(fullPath);

        if (!stats.isDirectory() || depth >= maxDepth) {
            return {
                name,
                path: relativePath,
                type: stats.isDirectory() ? "directory" : "file",
                size: stats.isFile() ? stats.size : undefined,
                modifiedAt: stats.mtime.toISOString()
            };
        }

        // Read directory contents
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        const children: FileTree[] = [];

        for (const entry of entries) {
            // Skip hidden files and common ignore patterns
            if (entry.name.startsWith('.') || 
                entry.name === 'node_modules' || 
                entry.name === 'dist' ||
                entry.name === 'build' ||
                entry.name === '.git') {
                continue;
            }

            const entryFullPath = path.join(fullPath, entry.name);
            // For the root level (depth -1), use entry name directly as relative path
            const entryRelativePath = depth < 0 ? entry.name : path.join(relativePath, entry.name);

            try {
                const child = await buildTree(entryFullPath, entryRelativePath, depth + 1, maxDepth);
                children.push(child);
            } catch (error) {
                // Skip entries that can't be accessed
                log.warn("Skipping inaccessible entry", {
                    path: entryFullPath,
                    error: (error as Error).message
                });
            }
        }

        return {
            name,
            path: relativePath,
            type: "directory",
            children: children.sort((a, b) => {
                // Directories first, then alphabetically
                if (a.type !== b.type) {
                    return a.type === "directory" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            }),
            modifiedAt: stats.mtime.toISOString()
        };
    }

    /**
     * Read file content
     */
    export async function read(filePath: string): Promise<{ success: boolean; content?: string; error?: string }> {
        log.info("Reading file", { filePath });

        try {
            // Get instance directory
            const basePath = Instance.getDirectory();
            const fullPath = path.join(basePath, filePath);

            log.info("Reading file content", {
                basePath,
                fullPath
            });

            // Check if file exists
            try {
                const stats = await fs.stat(fullPath);
                if (!stats.isFile()) {
                    return {
                        success: false,
                        error: `Path is not a file: ${filePath}`
                    };
                }
            } catch {
                return {
                    success: false,
                    error: `File not found: ${filePath}`
                };
            }

            // Read file content
            const content = await fs.readFile(fullPath, 'utf-8');

            log.info("File read successfully", {
                size: content.length
            });

            return {
                success: true,
                content
            };
        } catch (error: any) {
            log.error("Failed to read file", {
                error: error.message,
                filePath
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
}
