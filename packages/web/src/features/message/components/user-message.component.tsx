import { Minimize2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MessageWithParts } from "@/client/sandbox"
import { Markdown } from "@/components/markdown"

interface UserMessageProps {
  message: MessageWithParts
  index: number
  isCollapsed: boolean
  isThreadActive: boolean
  nextMessage?: MessageWithParts
  onToggleCollapse: (messageId: string) => void
}

/**
 * User message component with collapsible functionality
 */
export function UserMessage({
  message,
  index,
  isCollapsed,
  isThreadActive,
  nextMessage,
  onToggleCollapse,
}: UserMessageProps) {
  const { info, parts } = message
  const messageId = info.id || index.toString()

  // Get timestamp from time.created
  const timestamp = info.time && 'created' in info.time
    ? new Date(info.time.created)
    : undefined

  // Get first text part for preview
    const summary = message.info.summary;
  const firstTextPart = parts.find((part) => part.type === 'text' && 'text' in part && !part.synthetic)
  // @ts-ignore
    const previewText = (summary && "title" in summary ? summary.title : null) || (firstTextPart && 'text' in firstTextPart ? firstTextPart.text : '')

  return (
    <div className="group relative pl-4 border-l-2 border-zinc-800 hover:border-zinc-600 transition-colors">
      {/* Timeline dot indicator */}
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-zinc-950 border-2 border-zinc-800 group-hover:border-zinc-600 transition-colors flex items-center justify-center z-10">
        <button
          onClick={() => onToggleCollapse(messageId)}
          className="w-full h-full flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-zinc-600"
        >
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              isCollapsed ? "bg-blue-500 scale-125" : "bg-zinc-500 group-hover:bg-zinc-300",
              isThreadActive && "bg-blue-400 animate-pulse scale-125"
            )}
          />
        </button>
      </div>

      {isCollapsed ? (
        <div
          className="flex items-center gap-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
          onClick={() => onToggleCollapse(messageId)}
        >
          <span className="text-sm font-medium text-zinc-300">
            {previewText.split(" ").slice(0, 8).join(" ")}...
          </span>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
            <Maximize2 className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] text-zinc-500 font-mono">
              {nextMessage?.info.role === 'assistant' ? "Response hidden" : "Collapsed"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-300">
              {previewText.split(" ").slice(0, 4).join(" ")}...
            </span>
            {timestamp && (
              <span className="text-xs text-zinc-500 font-mono">
                {timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <button
              onClick={() => onToggleCollapse(messageId)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
            >
              <Minimize2 className="h-3 w-3 text-zinc-500 hover:text-zinc-300" />
            </button>
          </div>
          <div className="text-zinc-400 text-sm leading-relaxed">
            {parts.map((part, idx) => {
              if (part.type === 'text' && 'text' in part && !part.synthetic) {
                return <Markdown key={idx} content={part.text} />
              }
              return null
            })}
          </div>
        </div>
      )}
    </div>
  )
}
