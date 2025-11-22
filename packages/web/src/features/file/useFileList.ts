import { useMemo } from "react"
import { useProjects } from "@/features/project"
import type { MentionFile } from "@/components/FileMention"
import type { FileTreeNode } from "@/features/filesystem"

interface UseFileListOptions {
  projectFileTrees: Map<string, FileTreeNode>
}

/**
 * Hook to get a flat list of all files from all projects
 * 
 * This hook:
 * 1. Gets projects from the project store
 * 2. Takes file trees loaded by FileTreeManager (passed as param)
 * 3. Flattens them into a searchable MentionFile[] format
 * 
 * @param projectFileTrees - Map of project IDs to their file trees
 * @returns Array of MentionFile objects for all files across all projects
 */
export function useFileList({ projectFileTrees }: UseFileListOptions): MentionFile[] {
  const projects = useProjects()

  return useMemo(() => {
    const allFiles: MentionFile[] = []

    for (const project of projects) {
      const tree = projectFileTrees.get(project.id)
      if (!tree) continue

      // Flatten the tree for this project
      const flattenTree = (node: FileTreeNode, projectDir: string): void => {
        if (node.type === "file") {
          // Remove leading slash from path if present
          const relativePath = node.path.startsWith('/') ? node.path.slice(1) : node.path
          
          allFiles.push({
            id: `${project.id}-${node.path}`,
            name: node.name,
            path: `${projectDir}/${relativePath}`,
            type: "file",
          })
        }

        if (node.children) {
          for (const child of node.children) {
            flattenTree(child, projectDir)
          }
        }
      }

      flattenTree(tree, project.directory)
    }

    return allFiles
  }, [projects, projectFileTrees])
}
