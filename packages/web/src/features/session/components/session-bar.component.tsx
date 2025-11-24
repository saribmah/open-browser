import { useEffect, useRef } from "react"
import { X, Plus, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useVisibleSessions,
  useActiveSessionId,
  useAddUISession,
  useRemoveUISession,
  useSetActiveSession,
} from "@/features/session"
import { useOpenSpotlight } from "@/features/spotlight"
import type { UISession } from "@/features/session/session.store"

export function SessionBar() {
  // Get state and actions from session store
  const sessions = useVisibleSessions()
  const activeSessionId = useActiveSessionId()
  const addSession = useAddUISession()
  const removeSession = useRemoveUISession()
  const setActiveSession = useSetActiveSession()
  const sessionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  
  // Spotlight actions
  const openSpotlight = useOpenSpotlight()

  // Truncate title helper
  const MAX_TITLE_LENGTH = 30
  const truncateTitle = (title: string) => {
    if (title.length <= MAX_TITLE_LENGTH) return title
    return title.slice(0, MAX_TITLE_LENGTH) + "..."
  }

  // Handle creating a new session
  const handleNewSession = () => {
    const newSession: UISession = {
      id: Date.now().toString(),
      title: "new session",
      type: "chat",
      ephemeral: true,
    }
    addSession(newSession)
  }

  // Handle closing a session
  const handleCloseSession = (id: string) => {
    removeSession(id)
  }

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
        <div className="flex items-center h-full gap-1 px-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              ref={(el) => {
                if (el) sessionRefs.current.set(session.id, el)
                else sessionRefs.current.delete(session.id)
              }}
              className={cn(
                "group flex items-center gap-2 px-4 py-1.5 rounded-full cursor-pointer transition-colors shrink-0 relative",
                activeSessionId === session.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              onClick={() => setActiveSession(session.id)}
              title={session.title && session.title.length > MAX_TITLE_LENGTH ? session.title : undefined}
            >
              <span className="text-sm whitespace-nowrap">{truncateTitle(session.title || "")}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseSession(session.id)
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
          onClick={handleNewSession}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10 rounded-full transition-colors"
          aria-label="new session"
        >
          <Plus className="h-4 w-4" />
        </button>
        
        {/* Search Sessions Button */}
        <button
          onClick={() => openSpotlight('sessions')}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10 rounded-full transition-colors"
          aria-label="search sessions"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
