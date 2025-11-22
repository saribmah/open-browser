import { useMemo } from "react"
import type { MentionFile, FileNode } from "@/features/filesystem"
import { useFileTree } from "@/features/filesystem"

/**
 * Hook to get a flat list of all files from the file tree
 *
 * This hook:
 * 1. Reads the file tree from the filesystem store
 * 2. Flattens it into a searchable MentionFile[] format for file mentions/autocomplete
 *
 * @returns Array of MentionFile objects for all files
 */
export function useFileList(): MentionFile[] {
  const fileTree = useFileTree()

  return useMemo(() => {
    if (!fileTree) return []

    const allFiles: MentionFile[] = []

    // Flatten the tree recursively
    const flattenTree = (node: FileNode): void => {
      if (node.type === "file") {
        // Remove leading slash from path if present
        const path = node.path.startsWith('/') ? node.path.slice(1) : node.path

        allFiles.push({
          name: node.name,
          path: path,
          type: node.type,
        })
      }

      if (node.children) {
        for (const child of node.children) {
          flattenTree(child)
        }
      }
    }

    flattenTree(fileTree)

    return allFiles
  }, [fileTree])
}
