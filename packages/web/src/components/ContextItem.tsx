import { useState } from "react"
import { ChevronDown, ChevronRight, Trash2, Folder, Github, FileText } from "lucide-react"
import { FileTree } from "@/components/FileTree"
import type { FileNode } from "@/components/FileTree"

export interface ContextFile {
  name: string
  path: string
}

export interface Context {
  id: string
  name: string
  files: ContextFile[]
  tree?: FileNode[]
}

interface ContextItemProps {
  context: Context
  onDelete: (id: string) => void
  onFileClick?: (file: FileNode) => void
}

function getContextIcon(name: string) {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("github.com")) {
    return <Github className="h-4 w-4 text-white" />
  }
  if (lowerName.includes("arxiv.org")) {
    return <FileText className="h-4 w-4 text-orange-400" />
  }
  return <Folder className="h-4 w-4 text-blue-400" />
}

// Convert flat files to tree structure
function buildFileTree(files: ContextFile[]): FileNode[] {
  interface TreeNode extends FileNode {
    _children: { [key: string]: TreeNode }
  }

  const root: { [key: string]: TreeNode } = {}

  files.forEach((file) => {
    const parts = file.path.split("/").filter(Boolean)
    let current = root

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1
      const currentPath = "/" + parts.slice(0, index + 1).join("/")

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "directory",
          children: [],
          _children: {},
        }
      }

      if (!isFile) {
        current = current[part]._children
      }
    })
  })

  // Convert internal tree to FileNode array
  const convertToFileNodes = (nodeMap: { [key: string]: TreeNode }): FileNode[] => {
    return Object.values(nodeMap).map((node) => ({
      name: node.name,
      path: node.path,
      type: node.type,
      children: node.type === "directory" ? convertToFileNodes(node._children) : undefined,
    }))
  }

  // Sort nodes (directories first, then alphabetically)
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
      .map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }))
  }

  return sortNodes(convertToFileNodes(root))
}

export function ContextItem({ context, onDelete, onFileClick }: ContextItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const fileTree = context.tree || buildFileTree(context.files)

  return (
    <div className="border-b border-white/5 last:border-b-0">
      {/* Context Header */}
      <div className="flex items-center justify-between p-3 hover:bg-white/5 transition-colors group">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-400" />
          )}
          {getContextIcon(context.name)}
          <span className="text-sm text-white truncate">{context.name}</span>
        </button>
        <button
          onClick={() => onDelete(context.id)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
          aria-label="delete context"
        >
          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
        </button>
      </div>

      {/* File Tree */}
      {isExpanded && (
        <div className="pb-2">
          {fileTree.length === 0 ? (
            <div className="py-2 px-3 text-xs text-zinc-500 pl-10">no files</div>
          ) : (
            <FileTree nodes={fileTree} level={1} onFileClick={onFileClick} />
          )}
        </div>
      )}
    </div>
  )
}
