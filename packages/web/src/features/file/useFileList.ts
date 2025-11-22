import { useMemo } from "react"
import type { MentionFile } from "@/components/FileMention"
import type { FileTreeNode } from "@/features/filesystem"

interface UseFileListOptions {
  fileTree: FileTreeNode | null
}

/**
 * Hook to get a flat list of all files from the file tree
 * 
 * This hook:
 * 1. Takes the file tree loaded by FileTreeManager
 * 2. Flattens it into a searchable MentionFile[] format
 * 
 * @param fileTree - The file tree from the root directory
 * @returns Array of MentionFile objects for all files
 */
export function useFileList({ fileTree }: UseFileListOptions): MentionFile[] {
  return useMemo(() => {
    if (!fileTree) return []
    
    const allFiles: MentionFile[] = []

    // Flatten the tree recursively
    const flattenTree = (node: FileTreeNode): void => {
      if (node.type === "file") {
        // Remove leading slash from path if present
        const path = node.path.startsWith('/') ? node.path.slice(1) : node.path
        
        allFiles.push({
          id: node.path,
          name: node.name,
          path: path,
          type: "file",
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
