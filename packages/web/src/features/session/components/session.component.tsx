import { useState, useEffect, useRef } from "react"
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
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  // Filter only user messages for the nav rail
  const userMessages = messages.filter(m => m.info.role === 'user')

  // Intersection Observer to track active message
  useEffect(() => {
    if (!scrollContainerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-message-id')
            if (id) setActiveMessageId(id)
          }
        })
      },
      { 
        root: scrollContainerRef.current, 
        threshold: 0.1, 
        rootMargin: "-40% 0px -40% 0px" 
      }
    )

    const messageElements = document.querySelectorAll('.message-item')
    messageElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [messages])

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
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
    <div className="relative flex-1 h-full overflow-hidden">
      {/* Navigation Rail (Right) */}
      {!isLoadingMessages && messages.length > 0 && userMessages.length > 0 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-3 py-4 pr-1">
          {userMessages.map((msg) => {
            const messageId = msg.info.id || ''
            const isActive = activeMessageId === messageId
            
            // Get first text part for tooltip
            const firstTextPart = msg.parts.find((part) => part.type === 'text' && 'text' in part && !part.synthetic)
            const previewText = firstTextPart && 'text' in firstTextPart ? firstTextPart.text : ''
            
            return (
              <div key={messageId} className="group relative flex items-center justify-end">
                {/* Tooltip (Left of dot) */}
                <div className="absolute right-6 px-2 py-1 bg-zinc-800 text-zinc-200 text-[10px] rounded-md border border-zinc-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-30 origin-right scale-95 group-hover:scale-100 duration-200">
                  <span className="max-w-[150px] truncate block">{previewText.substring(0, 30)}...</span>
                </div>
                
                {/* Dot */}
                <button
                  onClick={() => scrollToMessage(messageId)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 border border-transparent ${
                    isActive 
                      ? "bg-blue-500 scale-125 shadow-[0_0_8px_rgba(59,130,246,0.8)] border-blue-400" 
                      : "bg-zinc-700 hover:bg-zinc-500 hover:scale-110"
                  }`}
                  aria-label="Go to message"
                />
              </div>
            )
          })}
        </div>
      )}

      <div ref={scrollContainerRef} className="h-full overflow-y-auto p-4 md:p-6 space-y-8">
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
                  <div 
                    key={messageId}
                    id={`msg-${messageId}`}
                    data-message-id={messageId}
                    className="message-item"
                  >
                    <Message
                      message={message}
                      index={idx}
                      nextMessage={messages[idx + 1]}
                      prevMessage={messages[idx - 1]}
                      isCollapsed={collapsedMessages.has(prevMessageId)}
                      onToggleCollapse={toggleMessageCollapse}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
