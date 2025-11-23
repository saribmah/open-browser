import type { ToolPart } from "@/client/sandbox"
import { EditTool, WriteTool, ReadTool, BashTool, GlobTool, GrepTool, ListTool, TodoWriteTool, TaskTool, WebfetchTool } from "@/features/tool"
import { FileCode, Terminal, FilePlus, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToolProps {
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
 * Generic pending tool component
 */
function PendingTool({ tool }: ToolProps) {
  const { state } = tool

  if (!('input' in state) || !state.input) {
    return null
  }

  const input = state.input as Record<string, unknown>
  const filePath = typeof input.filePath === 'string' ? input.filePath : 'unknown'
  
  // Extract just the filename from the path
  const parts = filePath.split('/')
  const title = parts[parts.length - 1] || filePath

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

  return (
    <div className="relative space-y-2">
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <div className="flex items-center justify-between p-2.5 border rounded-lg transition-all bg-zinc-900/50 border-zinc-800/50 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Circle className="h-3.5 w-3.5 text-zinc-600" />
            {getToolIcon()}
            <span className="text-xs font-mono text-zinc-400 truncate">{title}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Tool component that renders different tool types
 */
export function Tool({ tool }: ToolProps) {
  // Show generic pending state for pending tools
  if (tool.state.status === 'pending') {
    return <PendingTool tool={tool} />
  }

  // For non-pending states (running, completed, error), show specific tool components
  // These states should have metadata available
  if (tool.tool === 'edit') {
    return <EditTool tool={tool} />
  }
  if (tool.tool === 'write') {
    return <WriteTool tool={tool} />
  }
  if (tool.tool === 'bash') {
    return <BashTool tool={tool} />
  }
  if (tool.tool === 'read') {
    return <ReadTool tool={tool} />
  }
  if (tool.tool === 'glob') {
    return <GlobTool tool={tool} />
  }
  if (tool.tool === 'grep') {
    return <GrepTool tool={tool} />
  }
  if (tool.tool === 'list') {
    return <ListTool tool={tool} />
  }
  if (tool.tool === 'todowrite') {
    return <TodoWriteTool tool={tool} />
  }
  if (tool.tool === 'task') {
    return <TaskTool tool={tool} />
  }
  if (tool.tool === 'webfetch') {
    return <WebfetchTool tool={tool} />
  }

  // For other tool types, return null for now
  return null
}
