import { Maximize2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface SandboxNavbarProps {
  sessionTitle?: string
  progressPercentage?: number
  onMaximize?: () => void
  onNewSession?: () => void
}

export function SandboxNavbar({ 
  sessionTitle = "Session",
  progressPercentage,
  onMaximize,
  onNewSession,
}: SandboxNavbarProps) {
  return (
    <header className="h-12 border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Session title and progress */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-300">{sessionTitle}</span>
          {progressPercentage !== undefined && (
            <>
              <span className="text-zinc-700">•</span>
              <span className="text-sm text-zinc-500">{progressPercentage}%</span>
            </>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Maximize button */}
          <button
            onClick={onMaximize}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded transition-colors"
            aria-label="maximize"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* New session button */}
          <button
            onClick={onNewSession}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded transition-colors"
            aria-label="new session"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
