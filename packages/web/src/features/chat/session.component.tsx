import { Code } from "@/components/Code"
import { useMessages, useMessagesLoading } from "@/features/session"
import { useActiveSession } from "./chat.context"

/**
 * Session content component
 * Displays either a file viewer or chat messages based on the active session type
 */
export function SessionContent() {
  const activeSession = useActiveSession()
  const activeSessionApiId = activeSession?.sessionId
  const messages = useMessages(activeSessionApiId)
  const isLoadingMessages = useMessagesLoading()

  if (activeSession?.type === "file" && activeSession.fileContent) {
    // File viewer
    return (
      <Code
        file={{
          name: activeSession.title,
          contents: activeSession.fileContent,
        }}
      />
    )
  }

  // Chat messages area
  return (
    <div className="p-8 space-y-4">
      {isLoadingMessages ? (
        <div className="text-center text-zinc-500 mt-8">
          Loading messages...
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center text-zinc-500 mt-8">
          No messages yet. Start a conversation!
        </div>
      ) : (
        messages.map((message, idx) => {
          // The API returns messages with various fields
          const msg = message as any
          const info = msg.info || message
          const parts = msg.parts || []
          const summary = info.summary
          const time = info.time
          const role = info.role || message.role
          
          // Debug logging for first few messages
          if (idx < 3) {
            console.log(`Message ${idx}:`, { message, info, parts, summary })
          }
          
          // Extract text content from parts
          const textContent = parts
            .filter((part: any) => part.type === 'text' && part.text)
            .map((part: any) => part.text)
            .join('\n')
          
          return (
            <div
              key={info.id || message.id || idx}
              className="py-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase text-zinc-400">
                  {role}
                </span>
                {time?.created && (
                  <span className="text-xs text-zinc-500">
                    {new Date(time.created).toLocaleString()}
                  </span>
                )}
              </div>
              {summary?.title && (
                <div className="font-medium text-zinc-100 mb-2">
                  {summary.title}
                </div>
              )}
              {summary?.body && (
                <div className="text-sm text-zinc-300 mb-2 whitespace-pre-wrap">
                  {summary.body}
                </div>
              )}
              {textContent && !summary?.body && (
                <div className="text-sm text-zinc-300 mb-2 whitespace-pre-wrap">
                  {textContent}
                </div>
              )}
              {summary?.diffs && summary.diffs.length > 0 && (
                <div className="text-xs text-zinc-400 mt-2">
                  {summary.diffs.length} file{summary.diffs.length !== 1 ? 's' : ''} changed
                </div>
              )}
              {!summary?.title && !summary?.body && !textContent && (
                <div className="text-sm text-zinc-400 italic">
                  No content available
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
