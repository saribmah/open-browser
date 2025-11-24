import { Clock, Circle } from "lucide-react"
import { useMessages } from "@/features/message"
import { Tool } from "@/features/tool"
import type { ToolPart } from "@/client/sandbox"

/**
 * Activity Log component that shows a timeline of tool activities
 */
export function ActivityLog() {
  const messages = useMessages()

  // Extract all tool parts from messages
  const toolActivities: ToolPart[] = messages
    .flatMap((message) =>
      message.parts
        .filter((part) => part.type === 'tool')
        .map((part) => part as ToolPart)
    )
    // // Sort by timestamp, most recent first
    // .sort((a, b) => {
    //   const timeA = 'time' in a.state && a.state.time && 'start' in a.state.time ? a.state.time.start : 0
    //   const timeB = 'time' in b.state && b.state.time && 'start' in b.state.time ? b.state.time.start : 0
    //   return timeB - timeA
    // })
    // // Take the most recent 20
    // .slice(0, 20)

  return (
    <div className="w-80 border-l border-white/10 bg-black/30 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">Activity Log</span>
          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700">
            <span className="text-[10px] text-zinc-400 font-mono">{toolActivities.length}</span>
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Timeline</h3>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {toolActivities.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-600">
            <div className="text-center">
              <Circle className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No activity yet</p>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {toolActivities.map((toolPart) => (
              <div key={toolPart.id}>
                <Tool tool={toolPart} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
