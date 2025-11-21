import { useEffect, useRef } from "react"
import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Tab {
  id: string
  title: string
  type?: "chat" | "file"
  fileContent?: string
  filePath?: string
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onTabSelect: (id: string) => void
  onTabClose: (id: string) => void
  onNewTab: () => void
}

export function TabBar({ tabs, activeTabId, onTabSelect, onTabClose, onNewTab }: TabBarProps) {
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    const activeTabEl = tabRefs.current.get(activeTabId)
    if (activeTabEl) {
      activeTabEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })
    }
  }, [activeTabId])

  return (
    <div className="flex items-center justify-center h-[72px] px-2 gap-1 min-w-0">
      {/* Tabs - scrollable container */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-hide max-w-full">
        <div className="flex items-center h-full gap-1 justify-center">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el)
                else tabRefs.current.delete(tab.id)
              }}
              className={cn(
                "group flex items-center gap-2 px-4 py-1.5 rounded-full cursor-pointer transition-colors shrink-0",
                activeTabId === tab.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              onClick={() => onTabSelect(tab.id)}
            >
              <span className="text-sm whitespace-nowrap">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabClose(tab.id)
                  }}
                  className={cn(
                    "p-0.5 rounded transition-all",
                    activeTabId === tab.id
                      ? "opacity-50 hover:opacity-100 hover:bg-white/10"
                      : "opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:bg-white/10"
                  )}
                  aria-label="close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New Tab Button */}
      <button
        onClick={onNewTab}
        className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/10 rounded-full transition-colors shrink-0"
        aria-label="new tab"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
