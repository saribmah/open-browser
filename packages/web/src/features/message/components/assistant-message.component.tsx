import type { MessageWithParts } from "@/client/sandbox"
import { Tool } from "@/features/tool"

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

        // Render tool parts
        if (part.type === 'tool') {
          return <Tool key={part.id || idx} tool={part} />
        }

        return null
      })}
    </div>
  )
}
