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
    <div className="group relative pl-16 min-w-0">
      {/* Timeline dot indicator - pulsating dot like in mock design */}
      <div className="absolute top-0 z-10" style={{ left: '6px', transform: 'translateX(-50%)' }}>
        <button
          onClick={() => onToggleCollapse(messageId)}
          className="relative flex items-center justify-center focus:outline-none"
        >
          {isThreadActive ? (
            <>
              <div className="absolute h-3 w-3 rounded-full bg-zinc-100 animate-ping opacity-20" />
              <div className="relative h-3 w-3 rounded-full bg-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.4)] ring-4 ring-zinc-950" />
            </>
          ) : isCollapsed ? (
            <div className="h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] ring-4 ring-zinc-950" />
          ) : (
            <>
              <div className="absolute h-3 w-3 rounded-full bg-zinc-100 animate-ping opacity-20" />
              <div className="relative h-3 w-3 rounded-full bg-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.4)] ring-4 ring-zinc-950" />
            </>
          )}
        </button>
      </div>

      {isCollapsed ? (
        <div
          className="flex items-center gap-3 cursor-pointer opacity-60 hover:opacity-100 transition-opacity min-w-0"
          onClick={() => onToggleCollapse(messageId)}
        >
          <span className="text-sm font-medium text-zinc-300 truncate">
            {previewText.split(" ").slice(0, 8).join(" ")}...
          </span>
          <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 flex-shrink-0">
            <Maximize2 className="h-3 w-3 text-zinc-500" />
            <span className="text-[10px] text-zinc-500 font-mono">
              {nextMessage?.info.role === 'assistant' ? "Response hidden" : "Collapsed"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium text-zinc-300 truncate">
              {previewText.split(" ").slice(0, 4).join(" ")}...
            </span>
            {timestamp && (
              <span className="text-xs text-zinc-500 font-mono flex-shrink-0">
                {timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <button
              onClick={() => onToggleCollapse(messageId)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0"
            >
              <Minimize2 className="h-3 w-3 text-zinc-500 hover:text-zinc-300" />
            </button>
          </div>
          <div className="text-zinc-400 text-sm leading-relaxed min-w-0">
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
