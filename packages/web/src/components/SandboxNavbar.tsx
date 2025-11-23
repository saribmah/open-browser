import { Maximize2, Plus, PanelLeftClose, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSandboxContext } from "@/features/sandbox"
import type { SandboxStatus } from "@/features/sandbox"

interface SandboxNavbarProps {
  progressPercentage?: number
  onMaximize?: () => void
  onNewSession?: () => void
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
}

export function SandboxNavbar({ 
  progressPercentage,
  onMaximize,
  onNewSession,
  onToggleSidebar,
  isSidebarOpen = true,
}: SandboxNavbarProps) {
  // Get sandbox data from context
  const sandboxStatus = useSandboxContext((state) => state.status)
  const sandboxProvider = useSandboxContext((state) => state.sandbox?.provider)

  const getStatusColor = (status: SandboxStatus) => {
    switch (status) {
      case 'ready':
        return 'bg-green-500'
      case 'idle':
      case 'error':
        return 'bg-red-500'
      case 'setting-up':
      case 'creating':
        return 'bg-yellow-500 animate-pulse'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: SandboxStatus) => {
    switch (status) {
      case 'ready':
        return 'Ready'
      case 'idle':
        return 'Idle'
      case 'setting-up':
        return 'Setting up'
      case 'creating':
        return 'Creating'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <header className="h-12 border-b border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left side - Sidebar toggle and progress */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded transition-colors"
            aria-label={isSidebarOpen ? "close sidebar" : "open sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </button>
          {progressPercentage !== undefined && (
            <>
              <span className="text-zinc-700">•</span>
              <span className="text-sm text-zinc-500">{progressPercentage}%</span>
            </>
          )}
        </div>

        {/* Center - Sandbox status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5">
          <div className={cn("h-2 w-2 rounded-full", getStatusColor(sandboxStatus))} />
          <span className="text-xs text-zinc-400">{getStatusText(sandboxStatus)}</span>
          {sandboxProvider && (
            <>
              <span className="text-zinc-700">•</span>
              <span className="text-xs text-zinc-500">{sandboxProvider}</span>
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
