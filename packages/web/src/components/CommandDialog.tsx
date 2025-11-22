import { useEffect, useState, useRef } from "react"
import { Command } from "cmdk"
import { 
  Plus, 
  FileText, 
  Github, 
  MessageSquare, 
  Trash2,
  HelpCircle,
  File,
  Search
} from "lucide-react"
import type { MentionFile } from "@/components/FileMention"
import type { Session } from "@/features/session"

interface CommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddContext?: () => void
  onNewSession?: () => void
  onClearChat?: () => void
  onShowHelp?: () => void
  onFileSelect?: (file: MentionFile) => void
  onSessionSelect?: (session: Session) => void
  availableFiles?: MentionFile[]
  availableSessions?: Session[]
  initialPage?: string
}

export function CommandDialog({ 
  open, 
  onOpenChange,
  onAddContext,
  onNewSession,
  onClearChat,
  onShowHelp,
  onFileSelect,
  onSessionSelect,
  availableFiles = [],
  availableSessions = [],
  initialPage,
}: CommandDialogProps) {
  const [search, setSearch] = useState("")
  const [pages, setPages] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const page = pages[pages.length - 1]

  // Reset search, pages and focus input when dialog opens
  useEffect(() => {
    if (open) {
      setSearch("")
      setPages(initialPage ? [initialPage] : [])
      // Small delay to ensure the dialog is rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [open, initialPage])

  // Handle keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === "Escape" && open) {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <Command 
          className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          loop
          onKeyDown={(e) => {
            // Escape goes to previous page
            // Backspace goes to previous page when search is empty
            if (e.key === 'Escape' || (e.key === 'Backspace' && !search)) {
              e.preventDefault()
              if (pages.length > 0) {
                setPages((pages) => pages.slice(0, -1))
              } else {
                onOpenChange(false)
              }
            }
          }}
        >
          <Command.Input 
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="type a command or search..."
            className="w-full px-4 py-4 bg-transparent border-b border-white/10 text-white placeholder:text-zinc-500 focus:outline-none text-sm"
            autoFocus
          />
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-zinc-500">
              no results found.
            </Command.Empty>

            {!page && (
              <>
                <Command.Group heading="actions" className="px-2 py-1.5 text-xs text-zinc-500">
                  <Command.Item
                    value="new session"
                    onSelect={() => runCommand(() => onNewSession?.())}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>new session</span>
                    <span className="ml-auto text-xs text-zinc-500">⌘N</span>
                  </Command.Item>
                  <Command.Item
                    value="search sessions"
                    onSelect={() => setPages([...pages, 'sessions'])}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Search className="h-4 w-4" />
                    <span>search sessions…</span>
                  </Command.Item>
                  <Command.Item
                    value="add context"
                    onSelect={() => runCommand(() => onAddContext?.())}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    <span>add context</span>
                  </Command.Item>
                  <Command.Item
                    value="clear chat"
                    onSelect={() => runCommand(() => onClearChat?.())}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>clear chat</span>
                  </Command.Item>
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-white/10" />

                <Command.Group heading="integrations" className="px-2 py-1.5 text-xs text-zinc-500">
                  <Command.Item
                    value="open github"
                    onSelect={() => runCommand(() => window.open("https://github.com", "_blank"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Github className="h-4 w-4" />
                    <span>open github</span>
                  </Command.Item>
                  <Command.Item
                    value="open arxiv"
                    onSelect={() => runCommand(() => window.open("https://arxiv.org", "_blank"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <FileText className="h-4 w-4" />
                    <span>open arxiv</span>
                  </Command.Item>
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-white/10" />

                {availableFiles.length > 0 && (
                  <>
                    <Command.Group heading="files" className="px-2 py-1.5 text-xs text-zinc-500">
                      {availableFiles.map((file) => (
                        <Command.Item
                          key={file.id}
                          value={`${file.name} ${file.path}`}
                          onSelect={() => runCommand(() => onFileSelect?.(file))}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                        >
                          <File className="h-4 w-4" />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs text-zinc-500 truncate">{file.path}</span>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                    <Command.Separator className="my-2 h-px bg-white/10" />
                  </>
                )}

                <Command.Group heading="help" className="px-2 py-1.5 text-xs text-zinc-500">
                  <Command.Item
                    value="keyboard shortcuts"
                    onSelect={() => runCommand(() => onShowHelp?.())}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>keyboard shortcuts</span>
                    <span className="ml-auto text-xs text-zinc-500">?</span>
                  </Command.Item>
                </Command.Group>
              </>
            )}

            {page === 'sessions' && (
              <Command.Group heading="sessions" className="px-2 py-1.5 text-xs text-zinc-500">
                {availableSessions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">no sessions found</div>
                ) : (
                  availableSessions.map((session) => (
                    <Command.Item
                      key={session.id}
                      value={`${session.id} ${session.title} ${session.type || ''}`}
                      onSelect={() => runCommand(() => onSessionSelect?.(session))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{session.title}</span>
                        {session.type && (
                          <span className="text-xs text-zinc-500">{session.type}</span>
                        )}
                      </div>
                    </Command.Item>
                  ))
                )}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">↑↓</span> navigate
              <span className="text-zinc-400 ml-2">↵</span> select
              <span className="text-zinc-400 ml-2">esc</span> close
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}
