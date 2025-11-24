import { useState } from "react"
import { Globe, ChevronRight, CheckCircle2, Loader2, Circle, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolPart } from "@/client/sandbox"

interface WebfetchToolProps {
  tool: ToolPart
}

/**
 * Webfetch tool component that displays web fetching information
 */
export function WebfetchTool({ tool }: WebfetchToolProps) {
  const { state } = tool
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract URL and format from input
  if (!('input' in state) || !state.input) {
    return null
  }

  const input = state.input as Record<string, unknown>
  const url = typeof input.url === 'string' ? input.url : 'unknown'
  const format = typeof input.format === 'string' ? input.format : null

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

  // Get output if available (currently hidden as per original implementation)
  const output = 'output' in state && typeof state.output === 'string' ? state.output : null

  // Handle URL click
  const handleUrlClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (url && url !== 'unknown') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="relative">
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        {/* Webfetch header with optional expandable content */}
        <div className="border border-zinc-800/50 rounded-lg overflow-hidden">
          {/* Header - clickable to collapse/expand if there's output */}
          <div
            className={cn(
              "flex items-center justify-between p-2.5 bg-zinc-900/50",
              output ? "border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-900 transition-colors" : ""
            )}
            onClick={output ? () => setIsExpanded(!isExpanded) : undefined}
          >
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 min-w-0">
                {getStatusIcon()}
                <Globe className="h-4 w-4 flex-shrink-0 text-sky-400" />
                <span className="text-xs font-medium text-zinc-200">Webfetch</span>
                {format && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    format={format}
                  </span>
                )}
              </div>
              <div className="ml-8 flex items-center gap-1.5 min-w-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 truncate transition-colors underline-offset-2 hover:underline"
                  onClick={handleUrlClick}
                >
                  {url}
                </a>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-sky-500" />
              </div>
            </div>
            {output && (
              <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0 ml-2">
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 text-zinc-600 transition-transform duration-300 ease-in-out",
                  isExpanded && "rotate-90"
                )} />
              </div>
            )}
          </div>

          {/* Output content - conditionally rendered based on isExpanded (currently hidden) */}
          {false && output && (
            <div
              className={cn(
                "grid transition-all duration-200 ease-out overflow-hidden",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0">
                <div className="p-3 font-mono text-xs text-zinc-300 whitespace-pre-wrap bg-zinc-950">
                  {output}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
