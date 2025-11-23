import { useState } from "react"
import { Code } from "@/components/Code"
import { useActiveSession } from "@/features/session"
import { useMessages, useMessagesLoading, Message } from "@/features/message"
import { Terminal, Loader2 } from "lucide-react"

/**
 * Session content component
 * Displays either a file viewer or chat messages based on the active session type
 */
export function SessionContent() {
  const activeSession = useActiveSession()
  const activeSessionType = activeSession?.type
  const messages = useMessages()
  const isLoadingMessages = useMessagesLoading()
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(new Set())

  const toggleMessageCollapse = (messageId: string) => {
    setCollapsedMessages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  if (activeSession?.type === "file" && activeSession.fileContent) {
    // File viewer
    return (
      <Code
        file={{
          name: activeSession.title || activeSession.filePath || "Untitled",
          contents: activeSession.fileContent,
        }}
      />
    )
  }

  // Chat messages area
  return (
    <div className="p-4 md:p-6 space-y-8">
      {isLoadingMessages ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-zinc-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading messages...
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-zinc-500">
            <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div className="mb-2">No messages yet. Start a conversation!</div>
            <div className="text-xs text-zinc-600">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">⌘K</kbd> to explore
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Continuous timeline line with fade effect at both top and bottom */}
          <div className="absolute left-[5px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
          
          {/* Messages */}
          <div className="space-y-8">
            {messages.map((message, idx) => {
              const messageId = message.info.id || idx.toString()
              const isCollapsed = collapsedMessages.has(messageId)
              const prevMessageId = messages[idx - 1]?.info.id || (idx - 1).toString()
              
              return (
                <Message
                  key={messageId}
                  message={message}
                  index={idx}
                  nextMessage={messages[idx + 1]}
                  prevMessage={messages[idx - 1]}
                  isCollapsed={collapsedMessages.has(prevMessageId)}
                  onToggleCollapse={toggleMessageCollapse}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
