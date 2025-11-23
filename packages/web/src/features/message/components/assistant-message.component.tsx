import type { MessageWithParts } from "@/client/sandbox"
import { Tool } from "@/features/tool"
import { Markdown } from "@/components/markdown"

interface AssistantMessageProps {
  message: MessageWithParts
  index: number
}

/**
 * Assistant message component with file changes display
 */
export function AssistantMessage({
  message,
}: AssistantMessageProps) {
  const { parts } = message

  return (
    <div className="relative pl-16 space-y-4">
      {/* Timeline dot indicator for assistant */}
      <div className="absolute top-1 z-10" style={{ left: '6px', transform: 'translateX(-50%)' }}>
        <div className="h-3 w-3 rounded-full bg-zinc-600 border-2 border-zinc-950 ring-4 ring-zinc-950" />
      </div>

      {/* Loop over parts and render based on type */}
      {parts.map((part, idx) => {
        // Render text parts
        if (part.type === 'text' && 'text' in part) {
          return (
            <div key={part.id || idx}>
              <Markdown content={part.text} className="text-zinc-300 text-sm leading-relaxed" />
            </div>
          )
        }

        // Render tool parts
        if (part.type === 'tool') {
          return <Tool key={part.id || idx} tool={part} />
        }

        return null
      })}
    </div>
  )
}
