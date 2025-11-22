import { useMemo } from "react"
import { ContextItem } from "@/components/ContextItem"
import type { Context } from "@/components/ContextItem"
import { useFileTree, type FileTreeNode } from "@/features/filesystem"
import { useProjects, useRemoveProject } from "@/features/project"
import { useFileClick } from "./useFileClick"

/**
 * Manages file tree for the workspace
 * Uses the file tree loaded by FilesystemProvider
 */
export function FileTreeManager() {
  const projects = useProjects()
  const removeProject = useRemoveProject()
  const { handleFileClick } = useFileClick()
  
  // Get file tree from filesystem store (already loaded by FilesystemProvider)
  const fileTree = useFileTree()

  // Helper function to convert FileTreeNode to flat file list
  const flattenFileTree = (node: FileTreeNode): Array<{ path: string; name: string }> => {
    const files: Array<{ path: string; name: string }> = []
    
    if (node.type === "file") {
      files.push({
        path: node.path,
        name: node.name,
      })
    }
    
    if (node.children) {
      for (const child of node.children) {
        files.push(...flattenFileTree(child))
      }
    }
    
    return files
  }

  // Convert file tree and projects to Context format for UI
  const contexts = useMemo<Context[]>(() => {
    if (!fileTree) return []
    
    const files = flattenFileTree(fileTree)
    
    return projects.map((project) => {
      return {
        id: project.id,
        name: project.directory,
        directory: project.directory,
        files,
      }
    })
  }, [projects, fileTree])

  const handleDelete = async (id: string) => {
    const success = await removeProject(id)
    
    if (!success) {
      console.error("Failed to remove project")
    }
    // Project list is automatically updated by the store
  }

  return (
    <div>
      {contexts.map((context) => (
        <ContextItem
          key={context.id}
          context={context}
          onDelete={handleDelete}
          onFileClick={handleFileClick}
        />
      ))}
    </div>
  )
}
