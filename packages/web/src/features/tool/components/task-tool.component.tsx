import { useState } from "react"
import { Bot, ChevronRight, CheckCircle2, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolPart } from "@/client/sandbox"

interface TaskToolProps {
  tool: ToolPart
}

/**
 * Task tool component that displays agent task information
 */
export function TaskTool({ tool }: TaskToolProps) {
  const { state } = tool
  const [isExpanded, setIsExpanded] = useState(tool.state.status === 'running')

  // Extract task info from input
  if (!('input' in state) || !state.input) {
    return null
  }

  const input = state.input as Record<string, unknown>
  const subagentType = typeof input.subagent_type === 'string' ? input.subagent_type : null
  const description = typeof input.description === 'string' ? input.description : 'Task'
  
  // Create agent title - capitalize first letter of each word
  const agentTitle = subagentType 
    ? `${subagentType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Agent`
    : `${tool.tool.charAt(0).toUpperCase() + tool.tool.slice(1)} Agent`

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

  return (
    <div className="relative">
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        {/* Task header with optional expandable content */}
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
                <Bot className="h-4 w-4 flex-shrink-0 text-violet-400" />
                <span className="text-xs font-medium text-zinc-200 capitalize">{agentTitle}</span>
              </div>
              <div className="ml-8 text-xs text-zinc-400 truncate">
                {description}
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
