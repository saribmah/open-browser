import { useEffect } from "react"
import { Code } from "@/components/Code"
import {
  useMessages,
  useMessagesLoading,
  useGetMessages,
  useActiveSession,
} from "@/features/session"

/**
 * Session content component
 * Displays either a file viewer or chat messages based on the active session type
 */
export function SessionContent() {
  const activeSession = useActiveSession()
  const activeSessionId = activeSession?.id
  const activeSessionType = activeSession?.type
  const isEphemeral = activeSession?.ephemeral
  const messages = useMessages(activeSessionId)
  const isLoadingMessages = useMessagesLoading()
  const getMessages = useGetMessages()

  // Fetch messages when a non-ephemeral session becomes active
  useEffect(() => {
    if (activeSessionId && activeSessionType !== "file" && !isEphemeral) {
      getMessages(activeSessionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, activeSessionType, isEphemeral])

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
    <div className="p-8 space-y-4">
      {isLoadingMessages ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-zinc-500">
            Loading messages...
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-zinc-500">
            <div className="mb-2">No messages yet. Start a conversation!</div>
            <div className="text-xs text-zinc-600">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400">⌘K</kbd> to explore
            </div>
          </div>
        </div>
      ) : (
        messages.map((message, idx) => {
          // Message now has a well-defined structure with info and parts
          const { info, parts } = message
          const { time, role } = info

          // Extract text content from parts
          const textContent = parts
            .filter((part) => part.type === 'text' && 'text' in part)
            .map((part) => 'text' in part ? part.text : '')
            .join('\n')

          // Check if this is a user message with summary
          const isUserMessage = role === 'user'
          const summary = isUserMessage && 'summary' in info ? info.summary : undefined

          return (
            <div
              key={info.id || idx}
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
