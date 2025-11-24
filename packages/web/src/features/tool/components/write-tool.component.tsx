import { useState } from "react"
import { FilePlus, ChevronRight, CheckCircle2, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Code } from "@/components/Code"
import type { ToolPart } from "@/client/sandbox"

interface WriteToolProps {
  tool: ToolPart
}

/**
 * Get filename from file path
 */
function getFilename(filePath: string): string {
  const parts = filePath.split('/')
  return parts[parts.length - 1] || filePath
}

/**
 * Write tool component that displays file write information
 */
export function WriteTool({ tool }: WriteToolProps) {
  const { state } = tool
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract file path from input
  if (!('input' in state) || !state.input) {
    return null
  }

  const input = state.input as Record<string, unknown>
  const filePath = typeof input.filePath === 'string' ? input.filePath : 'unknown'

  // Get title from state or use filename
  const title = getFilename(filePath)

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

  // Get content if available
  const content = 'content' in state.input && typeof state.input.content === 'string' ? state.input.content : null

  return (
    <div className="relative">
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        {/* If we have content, make the header part of the content block */}
        {content ? (
          <div className="border border-zinc-800/50 rounded-lg overflow-hidden">
            {/* Header as part of the content - clickable to collapse/expand */}
            <div
              className="flex items-center justify-between p-2.5 bg-zinc-900/50 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-900 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {getStatusIcon()}
                <FilePlus className="h-4 w-4 flex-shrink-0 text-green-400" />
                <span className="text-xs font-mono text-zinc-400 truncate">{title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0">
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 text-zinc-600 transition-transform duration-300 ease-in-out",
                  isExpanded && "rotate-90"
                )} />
              </div>
            </div>
            {/* Content - conditionally rendered based on isExpanded */}
            <div
              className={cn(
                "grid transition-all duration-200 ease-out overflow-hidden",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0">
                <Code
                  file={{
                    name: filePath,
                    contents: content
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Standalone header when there's no output */
          <div className="flex items-center justify-between p-2.5 border rounded-lg transition-all cursor-pointer group bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {getStatusIcon()}
              <FilePlus className="h-4 w-4 flex-shrink-0 text-green-400" />
              <span className="text-xs font-mono text-zinc-400 truncate">{title}</span>
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
