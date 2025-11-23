import { FileCode, ChevronRight, Terminal, FilePlus, CheckCircle2, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolPart } from "@/client/sandbox"

interface EditToolProps {
  tool: ToolPart
}

/**
 * Get file type from file path
 */
function getFileType(filePath: string): 'tsx' | 'typescript' | 'javascript' | 'json' | 'other' {
  if (filePath.endsWith('.tsx')) return 'tsx'
  if (filePath.endsWith('.ts')) return 'typescript'
  if (filePath.endsWith('.json')) return 'json'
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript'
  return 'other'
}

/**
 * Edit tool component that displays file edit information
 */
export function EditTool({ tool }: EditToolProps) {
  const { state } = tool

  // Extract file path from input
  if (!('input' in state) || !state.input) {
    return null
  }

  const input = state.input as Record<string, unknown>
  const filePath = typeof input.filePath === 'string' ? input.filePath : 'unknown'
  
  // Get title from state or use filename
  let title = filePath
  if ('title' in state && state.title) {
    title = state.title
  } else {
    // Extract just the filename from the path
    const parts = filePath.split('/')
    title = parts[parts.length - 1] || filePath
  }

  // Get the appropriate icon based on tool type
  const getToolIcon = () => {
    switch (tool.tool) {
      case 'bash':
        return <Terminal className="h-4 w-4 flex-shrink-0 text-purple-400" />
      case 'write':
        return <FilePlus className="h-4 w-4 flex-shrink-0 text-green-400" />
      case 'edit':
      case 'read':
      default:
        return (
          <FileCode
            className={cn(
              "h-4 w-4 flex-shrink-0",
              getFileType(filePath) === "tsx" || getFileType(filePath) === "typescript"
                ? "text-blue-400"
                : getFileType(filePath) === "json"
                  ? "text-yellow-400"
                  : getFileType(filePath) === "javascript"
                    ? "text-green-400"
                    : "text-zinc-400"
            )}
          />
        )
    }
  }

  // Get status icon
  const getStatusIcon = () => {
    switch (state.status) {
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
      case 'running':
        return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
      case 'error':
        return <Circle className="h-3.5 w-3.5 text-red-500" />
      default:
        return <Circle className="h-3.5 w-3.5 text-zinc-600" />
    }
  }

  return (
    <div className="relative space-y-2">
      {/* Horizontal connector line from timeline to tool */}
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <div className="flex items-center justify-between p-2.5 border rounded-lg transition-all cursor-pointer group bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {getStatusIcon()}
            {getToolIcon()}
            <span className="text-xs font-mono text-zinc-400 truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0">
            <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
