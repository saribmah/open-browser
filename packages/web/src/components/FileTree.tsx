import { useState } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FileNode {
  name: string
  path: string
  type: "file" | "directory"
  children?: FileNode[]
}

interface FileTreeProps {
  nodes: FileNode[]
  level?: number
  onFileClick?: (file: FileNode) => void
  className?: string
}

interface FileTreeNodeProps {
  node: FileNode
  level: number
  onFileClick?: (file: FileNode) => void
}

function FileTreeNode({ node, level, onFileClick }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const paddingLeft = level * 12

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-white/5 transition-colors text-left"
          style={{ paddingLeft }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-zinc-500 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-400 shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-blue-400 shrink-0" />
          )}
          <span className="text-xs text-zinc-300 truncate">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child, index) => (
              <FileTreeNode
                key={`${child.path}-${index}`}
                node={child}
                level={level + 1}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => onFileClick?.(node)}
      className="w-full flex items-center gap-1.5 py-1 px-2 hover:bg-white/5 transition-colors text-left"
      style={{ paddingLeft: paddingLeft + 16 }}
    >
      <File className="h-4 w-4 text-zinc-500 shrink-0" />
      <span className="text-xs text-zinc-400 truncate">{node.name}</span>
    </button>
  )
}

export function FileTree({ nodes, level = 0, onFileClick, className }: FileTreeProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {nodes.map((node, index) => (
        <FileTreeNode
          key={`${node.path}-${index}`}
          node={node}
          level={level}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  )
}
