import { useState, useEffect, useMemo } from "react"
import { ContextItem } from "@/components/ContextItem"
import type { Context } from "@/components/ContextItem"
import type { FileNode } from "@/components/FileTree"
import { 
  useGetFileTree, 
  useFileTree,
  type FileTreeNode 
} from "@/features/filesystem"
import type { Project } from "@/features/project"

interface FileTreeManagerProps {
  projects: Project[]
  onFileClick?: (file: FileNode, directory?: string) => void
  onProjectDelete?: (projectId: string) => void
}

/**
 * Manages file trees for multiple projects
 * Handles loading, caching, and rendering of project file trees
 */
export function FileTreeManager({ projects, onFileClick, onProjectDelete }: FileTreeManagerProps) {
  const [projectFileTrees, setProjectFileTrees] = useState<Map<string, FileTreeNode>>(new Map())
  
  // Get filesystem actions
  const getFileTree = useGetFileTree()
  const fileTree = useFileTree()

  // Load file trees for all projects
  useEffect(() => {
    if (projects.length === 0) return

    const loadFileTrees = async () => {
      for (const project of projects) {
        // Skip if we already loaded this project's files
        if (projectFileTrees.has(project.id)) continue

        try {
          await getFileTree(project.directory, 3)
          
          // Store the file tree for this project
          if (fileTree) {
            setProjectFileTrees(prev => new Map(prev).set(project.id, fileTree))
          }
        } catch (error) {
          console.error(`Failed to load file tree for project ${project.id}:`, error)
        }
      }
    }

    loadFileTrees()
  }, [projects, getFileTree, fileTree, projectFileTrees])

  // Helper function to convert FileTreeNode to flat file list
  const flattenFileTree = (node: FileTreeNode, basePath = ""): Array<{ path: string; name: string }> => {
    const files: Array<{ path: string; name: string }> = []
    
    if (node.type === "file") {
      files.push({
        path: node.path,
        name: node.name,
      })
    }
    
    if (node.children) {
      for (const child of node.children) {
        files.push(...flattenFileTree(child, node.path))
      }
    }
    
    return files
  }

  // Convert projects to Context format for UI
  const contexts = useMemo<Context[]>(() => {
    return projects.map((project) => {
      const tree = projectFileTrees.get(project.id)
      const files = tree ? flattenFileTree(tree) : []
      
      return {
        id: project.id,
        name: project.directory,
        directory: project.directory, // Include directory for file path resolution
        files,
      }
    })
  }, [projects, projectFileTrees])

  const handleDelete = (id: string) => {
    onProjectDelete?.(id)
  }

  return (
    <div>
      {contexts.map((context) => (
        <ContextItem
          key={context.id}
          context={context}
          onDelete={handleDelete}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  )
}
