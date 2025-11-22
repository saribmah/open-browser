import { useState, useEffect } from "react"
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
  useRemoveProject,
} from "@/features/project"
import { 
  useReadFile, 
  useCurrentFile,
  type FileTreeNode,
} from "@/features/filesystem"
import { FileTreeManager, useFileList } from "@/features/file"
import { useCreateSession } from "@/features/session"

export function ChatComponent() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandInitialPage, setCommandInitialPage] = useState<string | undefined>()
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  const [projectFileTrees, setProjectFileTrees] = useState<Map<string, FileTreeNode>>(new Map())
  
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

  // Get session API actions
  const createSession = useCreateSession()

  // Get project state and actions
  const projects = useProjects()
  const getAllProjects = useGetAllProjects()
  const addProject = useAddProject()
  const removeProject = useRemoveProject()

  // Get filesystem actions
  const readFile = useReadFile()
  const currentFile = useCurrentFile()

  // Load projects on mount
  useEffect(() => {
    getAllProjects()
  }, [getAllProjects])

  // Watch for file loading completion and update tab
  useEffect(() => {
    if (!loadingFile || !currentFile || currentFile.path !== loadingFile) return

    // File has loaded, update the tab
    const existingSession = sessions.find((sess) => sess.id === loadingFile)
    if (existingSession && existingSession.fileContent === "Loading...") {
      // We need an updateTab action - for now, remove and re-add
      removeSession(loadingFile)
      const updatedSession: Session = {
        id: currentFile.path,
        title: existingSession.title,
        type: "file",
        fileContent: currentFile.content,
        filePath: currentFile.path,
      }
      addSession(updatedSession)
    }
    
    setLoadingFile(null)
  }, [currentFile, loadingFile, sessions, removeSession, addSession])

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

  const handleDeleteContext = async (id: string) => {
    const success = await removeProject(id)
    
    if (!success) {
      console.error("Failed to remove project")
    }
    // Project list is automatically updated by the store
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

  // Get flat file list from all projects using the hook
  const availableFiles = useFileList({ projectFileTrees })

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

  const handleFileClick = async (file: FileNode, directory?: string) => {
    // Construct the full path: directory/filePath
    // Remove leading slash from file.path if present to avoid double slashes
    const relativePath = file.path.startsWith('/') ? file.path.slice(1) : file.path
    const fullPath = directory ? `${directory}/${relativePath}` : file.path
    
    // Check if tab already exists for this file
    const existingSession = sessions.find((sess) => sess.id === fullPath)
    if (existingSession) {
      setActiveSession(existingSession.id)
      return
    }

    // Create tab with loading state
    const newSession: Session = {
      id: fullPath,
      title: file.name,
      type: "file",
      fileContent: "Loading...",
      filePath: fullPath,
    }
    addSession(newSession)
    setLoadingFile(fullPath)

    // Fetch file content with full path - useEffect will update the tab when loaded
    readFile(fullPath)
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
          setActiveSession(session.id)
          setCommandOpen(false)
        }}
        availableFiles={availableFiles}
        availableSessions={sessions}
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
              projects={projects}
              onFileClick={handleFileClick}
              onProjectDelete={handleDeleteContext}
              onFileTreesLoaded={setProjectFileTrees}
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
                <div className="p-8">
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
