import { useEffect, useRef } from "react"
import { X, Plus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Session {
  id: string
  title: string
  type?: "chat" | "file"
  sessionId?: string  // Session ID for chat sessions
  fileContent?: string
  filePath?: string
}

interface SessionBarProps {
  sessions: Session[]
  activeSessionId: string
  onSessionSelect: (id: string) => void
  onSessionClose: (id: string) => void
  onNewSession: () => void
  onSearchSessions?: () => void
}

export function SessionBar({ sessions, activeSessionId, onSessionSelect, onSessionClose, onNewSession, onSearchSessions }: SessionBarProps) {
  const sessionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    const activeSessionEl = sessionRefs.current.get(activeSessionId)
    if (activeSessionEl) {
      activeSessionEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
    }
  }, [activeSessionId])

  return (
    <div className="flex items-center justify-center h-[72px] px-2 gap-1 min-w-0">
      {/* Sessions - scrollable container */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-hide max-w-full">
        <div className="flex items-center h-full gap-1 justify-center">
          {sessions.map((session) => (
            <div
              key={session.id}
              ref={(el) => {
                if (el) sessionRefs.current.set(session.id, el)
                else sessionRefs.current.delete(session.id)
              }}
              className={cn(
                "group flex items-center gap-2 px-4 py-1.5 rounded-full cursor-pointer transition-colors shrink-0",
                activeSessionId === session.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              onClick={() => onSessionSelect(session.id)}
            >
              <span className="text-sm whitespace-nowrap">{session.title}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSessionClose(session.id)
                  }}
                  className={cn(
                    "p-0.5 rounded transition-all",
                    activeSessionId === session.id
                      ? "opacity-50 hover:opacity-100 hover:bg-white/10"
                      : "opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:bg-white/10"
                  )}
                  aria-label="close session"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New Session Button */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={onNewSession}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10 rounded-full transition-colors"
          aria-label="new session"
        >
          <Plus className="h-4 w-4" />
        </button>
        
        {/* Search Sessions Button */}
        {onSearchSessions && (
          <button
            onClick={onSearchSessions}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10 rounded-full transition-colors"
            aria-label="search sessions"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
