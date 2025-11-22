import { useEffect, useRef } from "react"
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
import {
  useSpotlightOpen,
  useSpotlightSearch,
  useSpotlightCurrentPage,
  useOpenSpotlight,
  useCloseSpotlight,
  useToggleSpotlight,
  useSetSpotlightSearch,
  usePushSpotlightPage,
  usePopSpotlightPage,
} from "./spotlight.context"
import { useFileList, useFileClick } from "@/features/file"
import { useSessions } from "@/features/session"
import { 
  useChatSessions,
  useAddSession,
  useSetActiveSession,
} from "@/features/chat/chat.context"
import type { Session } from "@/features/session/session-bar.component"
import type { FileNode, MentionFile } from "@/features/filesystem"

export function SpotlightComponent() {
  const inputRef = useRef<HTMLInputElement>(null)
  
  // State
  const isOpen = useSpotlightOpen()
  const search = useSpotlightSearch()
  const currentPage = useSpotlightCurrentPage()
  
  // Actions
  const closeSpotlight = useCloseSpotlight()
  const toggleSpotlight = useToggleSpotlight()
  const setSearch = useSetSpotlightSearch()
  const pushPage = usePushSpotlightPage()
  const popPage = usePopSpotlightPage()
  
  // Integration with other features
  const availableFiles = useFileList()
  const apiSessions = useSessions()
  const addSession = useAddSession()
  const setActiveSession = useSetActiveSession()
  const chatSessions = useChatSessions()
  const { handleFileClick } = useFileClick()

  // Map API sessions to Session format
  const availableSessions = apiSessions.map((apiSession): Session => ({
    id: apiSession.id,
    title: apiSession.title || apiSession.id,
    type: "chat",
    sessionId: apiSession.id,
  }))

  // Reset search and focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearch("")
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [isOpen, setSearch])

  // Handle keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSpotlight()
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault()
        closeSpotlight()
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [isOpen, toggleSpotlight, closeSpotlight])

  const runCommand = (command: () => void) => {
    closeSpotlight()
    command()
  }

  const handleNewSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: "new session",
    }
    addSession(newSession)
  }

  const handleFileSelect = (file: MentionFile) => {
    const fileNode: FileNode = {
      name: file.name,
      path: file.path,
      type: "file"
    }
    handleFileClick(fileNode)
  }

  const handleSessionSelect = (session: Session) => {
    const existingSession = chatSessions.find((s) => s.id === session.id)
    if (!existingSession) {
      addSession(session)
    }
    setActiveSession(session.id)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeSpotlight}
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
              if (currentPage) {
                popPage()
              } else {
                closeSpotlight()
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

            {!currentPage && (
              <>
                <Command.Group heading="actions" className="px-2 py-1.5 text-xs text-zinc-500">
                  <Command.Item
                    value="new session"
                    onSelect={() => runCommand(handleNewSession)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>new session</span>
                    <span className="ml-auto text-xs text-zinc-500">⌘N</span>
                  </Command.Item>
                  <Command.Item
                    value="search sessions"
                    onSelect={() => pushPage('sessions')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Search className="h-4 w-4" />
                    <span>search sessions…</span>
                  </Command.Item>
                  <Command.Item
                    value="add context"
                    onSelect={() => runCommand(() => console.log("Add context"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    <span>add context</span>
                  </Command.Item>
                  <Command.Item
                    value="clear chat"
                    onSelect={() => runCommand(() => console.log("Clear chat"))}
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
                          onSelect={() => runCommand(() => handleFileSelect(file))}
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
                    onSelect={() => runCommand(() => console.log("Show help"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>keyboard shortcuts</span>
                    <span className="ml-auto text-xs text-zinc-500">?</span>
                  </Command.Item>
                </Command.Group>
              </>
            )}

            {currentPage === 'sessions' && (
              <Command.Group heading="sessions" className="px-2 py-1.5 text-xs text-zinc-500">
                {availableSessions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">no sessions found</div>
                ) : (
                  availableSessions.map((session) => (
                    <Command.Item
                      key={session.id}
                      value={`${session.id} ${session.title} ${session.type || ''}`}
                      onSelect={() => runCommand(() => handleSessionSelect(session))}
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
