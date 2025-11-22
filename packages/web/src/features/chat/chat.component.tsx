import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ChatInput } from "@/components/ChatInput"
import { CommandDialog } from "@/components/CommandDialog"
import { Code } from "@/components/Code"
import type { MentionFile } from "@/components/FileMention"
import type { FileNode } from "@/components/FileTree"
import { SessionBar, type Session } from "@/features/session"
import {
  useChatSessions,
  useActiveSessionId,
  useActiveSession,
  useAddSession,
  useRemoveSession,
  useSetActiveSession,
  useSendMessage,
  useUpdateSessionId,
} from "./chat.context"
import {
  useProjects,
  useGetAllProjects,
  useAddProject,
} from "@/features/project"
import { type FileTreeNode } from "@/features/filesystem"
import { FileTreeManager, useFileList, useFileClick } from "@/features/file"
import { 
  useCreateSession,
  useSessions as useApiSessions,
  useGetMessages,
  useMessages,
  useMessagesLoading,
  type SessionData,
} from "@/features/session"

export function ChatComponent() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandInitialPage, setCommandInitialPage] = useState<string | undefined>()
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null)
  
  // Get state from chat store
  const sessions = useChatSessions()
  const activeSessionId = useActiveSessionId()
  const activeSession = useActiveSession()
  
  // Get actions from chat store
  const addSession = useAddSession()
  const removeSession = useRemoveSession()
  const setActiveSession = useSetActiveSession()
  const sendMessage = useSendMessage()
  const updateSessionId = useUpdateSessionId()

  // Get session API state and actions
  const apiSessions = useApiSessions()
  const createSession = useCreateSession()
  const getMessages = useGetMessages()
  
  // Get the sessionId and type separately to avoid object reference issues
  const activeSessionApiId = activeSession?.sessionId
  const activeSessionType = activeSession?.type
  const messages = useMessages(activeSessionApiId)
  const isLoadingMessages = useMessagesLoading()

  // Get project state and actions
  const projects = useProjects()
  const getAllProjects = useGetAllProjects()
  const addProject = useAddProject()

  // Get file click handler
  const { handleFileClick } = useFileClick()

  // Load projects on mount
  useEffect(() => {
    getAllProjects()
  }, [getAllProjects])

  // Fetch messages when a session with sessionId becomes active
  useEffect(() => {
    if (activeSessionApiId && activeSessionType !== "file") {
      console.log("Fetching messages for session:", activeSessionApiId)
      getMessages(activeSessionApiId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionApiId, activeSessionType])

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

  const handleSendMessage = async (message: string, mentionedFiles?: MentionFile[]) => {
    // Get the active tab
    if (!activeSession) return

    // Check if the tab has a session
    if (!activeSession.sessionId) {
      // Create a session for this tab
      console.log("Creating session for tab:", activeSession.id)
      const session = await createSession()
      
      if (!session) {
        console.error("Failed to create session")
        return
      }

      // Update the tab with the session ID
      updateSessionId(activeSession.id, session.id)
      console.log("Session created:", session.id)
      
      // TODO: Send message with session.id
    } else {
      // Session exists, send message
      console.log("Sending message with existing session:", activeSession.sessionId)
      // TODO: Send message with activeSession.sessionId
    }

    // For now, just call the existing sendMessage
    sendMessage(message, mentionedFiles)
  }

  // Get flat file list from the file tree
  const availableFiles = useFileList({ fileTree })

  // Map API sessions to Session format for CommandDialog
  const availableApiSessions = useMemo(() => {
    return apiSessions.map((apiSession): Session => ({
      id: apiSession.id,
      title: apiSession.title || apiSession.id,
      type: "chat",
      sessionId: apiSession.id,
    }))
  }, [apiSessions])

  const handleNewSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: "new session",
    }
    addSession(newSession)
  }

  const handleCloseSession = (id: string) => {
    removeSession(id)
  }

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
        onNewSession={handleNewSession}
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
            path: file.path.split('/').slice(1).join('/'), // Remove project dir from path
            type: "file"
          }
          const projectDir = file.path.split('/')[0] // Extract project directory
          handleFileClick(fileNode, projectDir)
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
            <FileTreeManager 
              onFileTreesLoaded={setFileTree}
            />
          )}
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Session Bar */}
          <SessionBar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSessionSelect={setActiveSession}
            onSessionClose={handleCloseSession}
            onNewSession={handleNewSession}
            onSearchSessions={handleSearchSessions}
          />

          {/* Content area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Main content - scrollable */}
            <div className="absolute inset-0 overflow-y-auto pb-48">
              {activeSession?.type === "file" && activeSession.fileContent ? (
                /* File viewer */
                <Code
                  file={{
                    name: activeSession.title,
                    contents: activeSession.fileContent,
                  }}
                />
              ) : (
                /* Chat messages area */
                <div className="p-8 space-y-4">
                  {isLoadingMessages ? (
                    <div className="text-center text-zinc-500 mt-8">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-zinc-500 mt-8">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    messages.map((message, idx) => {
                      // The API returns messages with various fields
                      const msg = message as any
                      const info = msg.info || message
                      const parts = msg.parts || []
                      const summary = info.summary
                      const time = info.time
                      const role = info.role || message.role
                      
                      // Debug logging for first few messages
                      if (idx < 3) {
                        console.log(`Message ${idx}:`, { message, info, parts, summary })
                      }
                      
                      // Extract text content from parts
                      const textContent = parts
                        .filter((part: any) => part.type === 'text' && part.text)
                        .map((part: any) => part.text)
                        .join('\n')
                      
                      return (
                        <div
                          key={info.id || message.id || idx}
                          className="py-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold uppercase text-zinc-400">
                              {role}
                            </span>
                            {time?.created && (
                              <span className="text-xs text-zinc-500">
                                {new Date(time.created).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {summary?.title && (
                            <div className="font-medium text-zinc-100 mb-2">
                              {summary.title}
                            </div>
                          )}
                          {summary?.body && (
                            <div className="text-sm text-zinc-300 mb-2 whitespace-pre-wrap">
                              {summary.body}
                            </div>
                          )}
                          {textContent && !summary?.body && (
                            <div className="text-sm text-zinc-300 mb-2 whitespace-pre-wrap">
                              {textContent}
                            </div>
                          )}
                          {summary?.diffs && summary.diffs.length > 0 && (
                            <div className="text-xs text-zinc-400 mt-2">
                              {summary.diffs.length} file{summary.diffs.length !== 1 ? 's' : ''} changed
                            </div>
                          )}
                          {!summary?.title && !summary?.body && !textContent && (
                            <div className="text-sm text-zinc-400 italic">
                              No content available
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Floating chat input - always visible at bottom */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
              <div className="pointer-events-auto">
                <ChatInput onSend={handleSendMessage} availableFiles={availableFiles} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
