import type { MessageWithParts } from "@/client/sandbox"
import { UserMessage } from "./user-message.component"
import { AssistantMessage } from "./assistant-message.component"

interface MessageProps {
  message: MessageWithParts
  index: number
  nextMessage?: MessageWithParts
  prevMessage?: MessageWithParts
  isCollapsed: boolean
  onToggleCollapse: (messageId: string) => void
}

/**
 * Message component that renders either a user or assistant message
 */
export function Message({
  message,
  index,
  nextMessage,
  prevMessage,
  isCollapsed,
  onToggleCollapse,
}: MessageProps) {
  const { info } = message
  
  // Check visibility states
  const shouldHideAssistant = 
    info.role === 'assistant' && 
    prevMessage?.info.role === 'user' && 
    isCollapsed
  
  if (shouldHideAssistant) return null
  
  const isThreadActive = info.role === 'user' && nextMessage?.info.role === 'assistant'
  
  // Check if this is the first assistant message in a sequence (show dot only for first)
  const isFirstAssistantInSequence = 
    info.role === 'assistant' && 
    prevMessage?.info.role !== 'assistant'

  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {info.role === 'user' ? (
        <UserMessage
          message={message}
          index={index}
          isCollapsed={isCollapsed}
          isThreadActive={isThreadActive}
          nextMessage={nextMessage}
          onToggleCollapse={onToggleCollapse}
        />
      ) : (
        <AssistantMessage
          message={message}
          index={index}
          showDot={isFirstAssistantInSequence}
        />
      )}
    </div>
  )
}
