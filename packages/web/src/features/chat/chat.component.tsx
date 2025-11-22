import { useState, useMemo } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ChatInput } from "./chat-input.component"
import { CommandDialog } from "@/components/CommandDialog"
import type { FileNode } from "@/components/FileTree"
import { SessionBar, type Session } from "@/features/session"
import {
  useChatSessions,
  useAddSession,
  useSetActiveSession,
} from "./chat.context"
import {
  useProjects,
  useGetAllProjects,
  useAddProject,
} from "@/features/project"
import { FileTreeManager, useFileList, useFileClick } from "@/features/file"
import { useSessions as useApiSessions } from "@/features/session"
import { SessionContent } from "./session.component"

export function ChatComponent() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandInitialPage, setCommandInitialPage] = useState<string | undefined>()

  // Get state from chat store
  const sessions = useChatSessions()

  // Get actions from chat store
  const addSession = useAddSession()
  const setActiveSession = useSetActiveSession()

  // Get session API state and actions
  const apiSessions = useApiSessions()

  // Get project state and actions
  const projects = useProjects()
  const getAllProjects = useGetAllProjects()
  const addProject = useAddProject()

  // Get file click handler and file list for mentions
  const { handleFileClick } = useFileClick()
  const availableFiles = useFileList()

  const handleAddContext = async (url: string) => {
    console.log("Adding project:", url)

    const success = await addProject({
      url,
    })

    if (success) {
      // Refresh projects list
      getAllProjects()
    }
  }

  // Map API sessions to Session format for CommandDialog
  const availableApiSessions = useMemo(() => {
    return apiSessions.map((apiSession): Session => ({
      id: apiSession.id,
      title: apiSession.title || apiSession.id,
      type: "chat",
      sessionId: apiSession.id,
    }))
  }, [apiSessions])

  const handleSearchSessions = () => {
    setCommandInitialPage('sessions')
    setCommandOpen(true)
  }

  return (
    <>
      <CommandDialog
        open={commandOpen}
        onOpenChange={(open) => {
          setCommandOpen(open)
          if (!open) {
            setCommandInitialPage(undefined)
          }
        }}
        onNewSession={() => {
          const newSession: Session = {
            id: Date.now().toString(),
            title: "new session",
          }
          addSession(newSession)
        }}
        onAddContext={() => {
          // Focus on the sidebar add context input
          setCommandOpen(false)
        }}
        onClearChat={() => {
          console.log("Clear chat")
        }}
        onFileSelect={(file) => {
          // Create file node from MentionFile to reuse handleFileClick
          const fileNode: FileNode = {
            name: file.name,
            path: file.path,
            type: "file"
          }
          handleFileClick(fileNode)
        }}
        onSessionSelect={(session) => {
          // Check if session already exists in local sessions
          const existingSession = sessions.find((s) => s.id === session.id)
          if (!existingSession) {
            // Add the session to local sessions
            addSession(session)
          }
          setActiveSession(session.id)
          setCommandOpen(false)
        }}
        availableFiles={availableFiles}
        availableSessions={availableApiSessions}
        initialPage={commandInitialPage}
      />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          onAddContext={handleAddContext}
          contexts={projects.map(p => ({ id: p.id, name: p.directory }))}
        >
          {projects.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">
              no projects added yet. click "add context" to get started.
            </div>
          ) : (
            <FileTreeManager />
          )}
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Session Bar */}
          <SessionBar onSearchSessions={handleSearchSessions} />

          {/* Content area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Main content - scrollable */}
            <div className="absolute inset-0 overflow-y-auto pb-48">
              <SessionContent />
            </div>

            {/* Floating chat input - always visible at bottom */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
              <div className="pointer-events-auto">
                <ChatInput />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
