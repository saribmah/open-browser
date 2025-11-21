import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Github, FileText, Folder } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import type { ReactNode, FormEvent } from "react"

interface ContextInfo {
  id: string
  name: string
}

interface SidebarProps {
  children: ReactNode
  defaultCollapsed?: boolean
  onAddContext?: (url: string) => void
  contexts?: ContextInfo[]
  onContextClick?: (id: string) => void
}

function getContextIcon(name: string) {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("github.com")) {
    return <Github className="h-4 w-4" />
  }
  if (lowerName.includes("arxiv.org")) {
    return <FileText className="h-4 w-4" />
  }
  return <Folder className="h-4 w-4" />
}

export function Sidebar({ children, defaultCollapsed = false, onAddContext, contexts = [], onContextClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [url, setUrl] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (url && onAddContext) {
      onAddContext(url)
      setUrl("")
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

      {/* Collapsed View - Icons Only */}
      {isCollapsed && (
        <div className="h-full flex flex-col items-center pt-[22px] gap-2">
          {/* Add button */}
          <button
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="add context"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Context icons */}
          {contexts.map((context) => (
            <button
              key={context.id}
              onClick={() => {
                onContextClick?.(context.id)
                setIsCollapsed(false)
              }}
              className="h-8 w-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title={context.name}
            >
              {getContextIcon(context.name)}
            </button>
          ))}
        </div>
      )}

      {/* Expanded View - Full Content */}
      <div
        className={cn(
          "h-full overflow-hidden transition-opacity duration-300 flex flex-col",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}
      >
        {/* Add Context Input */}
        <div className="h-[72px] flex items-center px-4">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2 w-full">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="add url..."
              className="h-8 px-4 rounded-full bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-sm"
            />
            <Button
              type="submit"
              className="h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Children Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </aside>
  )
}
