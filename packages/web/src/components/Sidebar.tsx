import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface SidebarProps {
  children: ReactNode
  defaultCollapsed?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

/**
 * Sidebar component - Presentational component for sidebar layout
 * Handles collapse/expand functionality and styling
 * Can be controlled (collapsed + onCollapsedChange) or uncontrolled (defaultCollapsed)
 */
export function Sidebar({ 
  children, 
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange
}: SidebarProps) {
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(defaultCollapsed)
  
  // Use controlled state if provided, otherwise use uncontrolled
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : uncontrolledCollapsed
  
  const handleToggle = () => {
    const newValue = !isCollapsed
    if (onCollapsedChange) {
      onCollapsedChange(newValue)
    } else {
      setUncontrolledCollapsed(newValue)
    }
  }

  return (
    <aside
      className={cn(
        "relative h-full border-r border-white/10 bg-black/50 backdrop-blur-xl transition-all duration-300 ease-in-out",
        isCollapsed ? "w-14" : "w-80"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black text-zinc-400 hover:text-white transition-colors"
        aria-label={isCollapsed ? "expand sidebar" : "collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Content */}
      {children}
    </aside>
  )
}
