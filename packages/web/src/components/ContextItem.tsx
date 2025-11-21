import { useState } from "react"
import { ChevronDown, ChevronRight, Trash2, File, Folder, Github, FileText } from "lucide-react"

export interface ContextFile {
  name: string
  path: string
}

export interface Context {
  id: string
  name: string
  files: ContextFile[]
}

interface ContextItemProps {
  context: Context
  onDelete: (id: string) => void
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

export function ContextItem({ context, onDelete }: ContextItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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
          aria-label="Delete context"
        >
          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
        </button>
      </div>

      {/* Files List */}
      {isExpanded && (
        <div className="pl-6 pb-2">
          {context.files.length === 0 ? (
            <div className="py-2 px-3 text-xs text-zinc-500">no files</div>
          ) : (
            context.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 py-1.5 px-3 hover:bg-white/5 rounded transition-colors"
              >
                <File className="h-3 w-3 text-zinc-500" />
                <span className="text-xs text-zinc-400 truncate">{file.name}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
