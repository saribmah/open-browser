import { useState } from "react"
import { ListChecks, ChevronRight, CheckCircle2, Loader2, Circle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolPart } from "@/client/sandbox"

interface TodoWriteToolProps {
  tool: ToolPart
}

interface Todo {
  id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: string
}

/**
 * TodoWrite tool component that displays todo list information
 */
export function TodoWriteTool({ tool }: TodoWriteToolProps) {
  const { state } = tool
  const [isExpanded, setIsExpanded] = useState(tool.state.status === 'running')

  // Extract todos from input
  if (!('input' in state) || !state.input) {
    return null
  }

  const input = state.input as Record<string, unknown>
  const todos = Array.isArray(input.todos) ? input.todos as Todo[] : []

  // Calculate completed count
  const completedCount = todos.filter(t => t.status === 'completed').length
  const totalCount = todos.length

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
    <div className="relative">
      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
        {/* If we have todos, make the header part of the content block */}
        {todos.length > 0 ? (
          <div className="border border-zinc-800/50 rounded-lg overflow-hidden">
            {/* Header as part of the content - clickable to collapse/expand */}
            <div 
              className="flex items-center justify-between p-2.5 bg-zinc-900/50 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-900 transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {getStatusIcon()}
                <ListChecks className="h-4 w-4 flex-shrink-0 text-indigo-400" />
                <span className="text-xs font-mono text-zinc-400">To-dos</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0">
                <span className="text-zinc-500">{completedCount}/{totalCount}</span>
                <ChevronRight className={cn(
                  "h-3.5 w-3.5 text-zinc-600 transition-transform duration-300 ease-in-out",
                  isExpanded && "rotate-90"
                )} />
              </div>
            </div>
            {/* Todos content - conditionally rendered based on isExpanded */}
            <div
              className={cn(
                "grid transition-all duration-200 ease-out overflow-hidden",
                isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0">
                <div className="p-3 space-y-2 bg-zinc-950">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-start gap-2.5 group"
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        "flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center mt-0.5 transition-colors",
                        todo.status === 'completed'
                          ? "bg-green-500/20 border-green-500"
                          : todo.status === 'in_progress'
                            ? "bg-blue-500/20 border-blue-500"
                            : todo.status === 'cancelled'
                              ? "bg-zinc-600/20 border-zinc-600"
                              : "bg-transparent border-zinc-600"
                      )}>
                        {todo.status === 'completed' && (
                          <Check className="h-3 w-3 text-green-400" />
                        )}
                        {todo.status === 'in_progress' && (
                          <div className="h-2 w-2 rounded-full bg-blue-400" />
                        )}
                      </div>
                      {/* Todo content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-mono",
                          todo.status === 'completed'
                            ? "text-zinc-500 line-through"
                            : todo.status === 'cancelled'
                              ? "text-zinc-600 line-through"
                              : "text-zinc-300"
                        )}>
                          {todo.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standalone header when there are no todos */
          <div className="flex items-center justify-between p-2.5 border rounded-lg transition-all cursor-pointer group bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-900 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {getStatusIcon()}
              <ListChecks className="h-4 w-4 flex-shrink-0 text-indigo-400" />
              <span className="text-xs font-mono text-zinc-400">To-dos</span>
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
