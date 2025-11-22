import { useEffect, useMemo } from "react"
import { ContextItem } from "@/components/ContextItem"
import type { Context } from "@/components/ContextItem"
import { 
  useGetFileTree, 
  useFileTree,
  type FileTreeNode 
} from "@/features/filesystem"
import { useProjects, useRemoveProject } from "@/features/project"
import { useFileClick } from "./useFileClick"

interface FileTreeManagerProps {
  onFileTreesLoaded?: (tree: FileTreeNode | null) => void
}

/**
 * Manages file tree for the workspace
 * Loads all files from the root directory
 */
export function FileTreeManager({ onFileTreesLoaded }: FileTreeManagerProps) {
  const projects = useProjects()
  const removeProject = useRemoveProject()
  const { handleFileClick } = useFileClick()
  
  // Get filesystem state and actions
  const getFileTree = useGetFileTree()
  const fileTree = useFileTree()

  // Load file tree from root directory
  useEffect(() => {
    const loadFileTree = async () => {
      try {
        // Load from root directory with depth of 3
        await getFileTree("/", 3)
      } catch (error) {
        console.error("Failed to load file tree:", error)
      }
    }

    loadFileTree()
  }, [getFileTree])

  // Notify parent when file tree is loaded
  useEffect(() => {
    onFileTreesLoaded?.(fileTree)
  }, [fileTree, onFileTreesLoaded])

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
