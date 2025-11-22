import { Terminal, FileCode, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessageWithParts } from "@/client/sandbox"

interface AssistantMessageProps {
  message: MessageWithParts
  index: number
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
 * Assistant message component with file changes display
 */
export function AssistantMessage({
  message,
}: AssistantMessageProps) {
  const { parts } = message

  return (
    <div className="space-y-4">
      {/* Loop over parts and render based on type */}
      {parts.map((part, idx) => {
        // Render text parts
        if (part.type === 'text' && 'text' in part) {
          return (
            <div key={part.id || idx} className="flex gap-2 pl-6 border-l border-zinc-800">
              <div className="text-zinc-300 text-sm leading-relaxed">
                {part.text}
              </div>
            </div>
          )
        }

        // Render tool parts (file changes)
        if (part.type === 'tool' && 'tool' in part && 'state' in part) {
          const toolState = part.state

          // Check if tool is completed and has a title
          if (toolState.status === 'completed' && 'title' in toolState) {
            const title = toolState.title

            // Check if this is an edit tool with file information
            if (part.tool === 'edit' && 'input' in toolState && toolState.input) {
              const input = toolState.input as Record<string, unknown>
              const filePath = typeof input.filePath === 'string' ? input.filePath: 'unknown'

              return (
                <div key={part.id || idx} className="space-y-2 pl-6">
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
          }
        }

        return null
      })}
    </div>
  )
}
