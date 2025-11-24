import { useState, useEffect, useRef, useCallback } from "react"
import { Code } from "@/components/Code"
import { useActiveSession } from "@/features/session"
import { useMessages, useMessagesLoading, Message } from "@/features/message"
import { Terminal, Loader2, ArrowDown } from "lucide-react"

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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const lastScrollHeightRef = useRef(0)

  const toggleMessageCollapse = useCallback((messageId: string) => {
    setCollapsedMessages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }, [])

  // Detect if user is scrolled near bottom
  const checkIfShouldAutoScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const threshold = 150 // pixels from bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    
    setShouldAutoScroll(isNearBottom)
  }, [])

  // Handle user scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      checkIfShouldAutoScroll()
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [checkIfShouldAutoScroll])

  // Auto-scroll when messages change (new message or streaming update)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const currentScrollHeight = container.scrollHeight
    
    // Always update the ref to track content changes
    // But only scroll if shouldAutoScroll is enabled
    if (shouldAutoScroll && currentScrollHeight > lastScrollHeightRef.current) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
    
    lastScrollHeightRef.current = currentScrollHeight
  }, [messages, shouldAutoScroll])

  // Reset auto-scroll when session changes
  useEffect(() => {
    setShouldAutoScroll(true)
    lastScrollHeightRef.current = 0
  }, [activeSession?.id])

  // Scroll to bottom on initial load when messages are first available
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || isLoadingMessages || messages.length === 0) return

    // Check if this is the first load (lastScrollHeightRef is 0)
    if (lastScrollHeightRef.current === 0) {
      // Use setTimeout to ensure DOM has updated with all messages
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto' // instant scroll on initial load
        })
        lastScrollHeightRef.current = container.scrollHeight
      }, 0)
    }
  }, [messages, isLoadingMessages])

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

  const scrollToMessage = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    })
    setShouldAutoScroll(true)
  }, [])

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
      {/* Scroll to bottom button */}
      {!shouldAutoScroll && messages.length > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-full shadow-lg border border-zinc-600 flex items-center gap-2 transition-all duration-200 hover:scale-105"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
          <span className="text-sm">Scroll to bottom</span>
        </button>
      )}

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
          <div className="relative md:pr-16">
            {/* Continuous timeline line with fade effect at both top and bottom */}
            <div className="absolute left-[5px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />

            {/* Messages */}
            <div className="space-y-8">
              {messages.map((message, idx) => {
                const messageId = message.info.id || idx.toString()
                const isCollapsed = collapsedMessages.has(messageId)

                // For assistant messages, check if we're in a collapsed thread
                // Walk backwards to find the most recent user message
                let isInCollapsedThread = false
                if (message?.info?.role === 'assistant') {
                  for (let i = idx - 1; i >= 0; i--) {
                    const prevMsg = messages[i]
                    if (prevMsg?.info?.role === 'user') {
                      const userMsgId = prevMsg.info.id || i.toString()
                      isInCollapsedThread = collapsedMessages.has(userMsgId)
                      break
                    }
                  }
                }

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
                      isCollapsed={message?.info?.role === 'user' ? isCollapsed : isInCollapsedThread}
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
