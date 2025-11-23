import { FileCode, ChevronRight } from "lucide-react"
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

  // Only render completed tools with title
  if (state.status !== 'completed' || !('title' in state)) {
    return null
  }

  const title = state.title

  // Extract file path from input
  if (!('input' in state) || !state.input) {
    return null
  }

  const input = state.input as Record<string, unknown>
  const filePath = typeof input.filePath === 'string' ? input.filePath : 'unknown'

  return (
    <div className="relative space-y-2">
      {/* Horizontal connector line from timeline to tool */}
      <div className="absolute -left-[10px] top-6 w-[18px] h-[2px] bg-zinc-800" />
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        <div className="flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer group bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900">
          <div className="flex items-center gap-3">
            <FileCode
              className={cn(
                "h-4 w-4",
                getFileType(filePath) === "tsx" || getFileType(filePath) === "typescript"
                  ? "text-blue-400"
                  : getFileType(filePath) === "json"
                    ? "text-yellow-400"
                    : getFileType(filePath) === "javascript"
                      ? "text-green-400"
                      : "text-zinc-400"
              )}
            />
            <span className="text-sm font-mono text-zinc-400">{title}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
