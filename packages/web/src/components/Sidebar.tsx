import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SidebarProps {
  children: (collapsed: boolean, setCollapsed: (collapsed: boolean) => void) => ReactNode
  defaultCollapsed?: boolean
}

/**
 * Sidebar component - Presentational component for sidebar layout
 * Handles only the collapse/expand functionality and styling
 * Exposes collapsed state to children via render prop
 */
export function Sidebar({ children, defaultCollapsed = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <aside
      className={cn(
        "relative h-full border-r border-white/10 bg-black/50 backdrop-blur-xl transition-all duration-300 ease-in-out",
        isCollapsed ? "w-14" : "w-80"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black text-zinc-400 hover:text-white transition-colors"
        aria-label={isCollapsed ? "expand sidebar" : "collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Content - render prop pattern to expose collapsed state */}
      {children(isCollapsed, setIsCollapsed)}
    </aside>
  )
}
