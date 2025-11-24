import { useState } from "react"
import { FolderOpen, ChevronRight, CheckCircle2, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolPart } from "@/client/sandbox"

interface ListToolProps {
  tool: ToolPart
}

/**
 * List tool component that displays directory listing information
 */
export function ListTool({ tool }: ListToolProps) {
  const { state } = tool
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract path from input
  if (!('input' in state) || !state.input) {
    return null
  }

  const input = state.input as Record<string, unknown>
  const path = typeof input.path === 'string' ? input.path : 'unknown'

  // Get just the directory name for display
  const getDirectoryName = (fullPath: string): string => {
    if (!fullPath || fullPath === '.') return 'current directory'
    const parts = fullPath.split('/')
    return parts[parts.length - 1] || fullPath
  }

  const displayName = getDirectoryName(path)

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

  // Get output if available
  const output = 'output' in state && typeof state.output === 'string' ? state.output : null

  return (
    <div className="relative">
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        {/* If we have output, make the header part of the content block */}
        {output ? (
          <div className="border border-zinc-800/50 rounded-lg overflow-hidden">
            {/* Header as part of the content - clickable to collapse/expand */}
            <div
              className="flex items-center justify-between p-2.5 bg-zinc-900/50 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-900 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {getStatusIcon()}
                <FolderOpen className="h-4 w-4 flex-shrink-0 text-amber-400" />
                <span className="text-xs font-mono text-zinc-400 truncate">{displayName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0">
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 text-zinc-600 transition-transform duration-300 ease-in-out",
                  isExpanded && "rotate-90"
                )} />
              </div>
            </div>
            {/* Output content - conditionally rendered based on isExpanded */}
            <div
              className={cn(
                "grid transition-all duration-200 ease-out overflow-hidden",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0">
                <div className="p-3 font-mono text-xs bg-zinc-950">
                  {/* Directory path with icon styling */}
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-amber-400 select-none">📁</span>
                    <span className="text-zinc-100 flex-1">{path === '.' ? './' : path}</span>
                  </div>
                  {/* Directory listing output */}
                  {output && (
                    <div className="text-zinc-300 whitespace-pre-wrap pl-6 border-l-2 border-zinc-800">
                      {output}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standalone header when there's no output */
          <div className="flex items-center justify-between p-2.5 border rounded-lg transition-all cursor-pointer group bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {getStatusIcon()}
              <FolderOpen className="h-4 w-4 flex-shrink-0 text-amber-400" />
              <span className="text-xs font-mono text-zinc-400 truncate">{displayName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0">
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
