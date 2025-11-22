import { useState, useEffect } from "react"
import type { FileNode } from "@/components/FileTree"
import type { Session } from "@/features/session"
import { 
  useChatSessions,
  useAddSession,
  useRemoveSession,
  useSetActiveSession,
} from "@/features/chat"
import { useReadFile, useCurrentFile } from "@/features/filesystem"

/**
 * Hook to handle file click functionality
 * Manages file tab creation, loading state, and content fetching
 */
export function useFileClick() {
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  
  // Get chat state and actions
  const sessions = useChatSessions()
  const addSession = useAddSession()
  const removeSession = useRemoveSession()
  const setActiveSession = useSetActiveSession()
  
  // Get filesystem actions
  const readFile = useReadFile()
  const currentFile = useCurrentFile()

  // Watch for file loading completion and update tab
  useEffect(() => {
    if (!loadingFile || !currentFile || currentFile.path !== loadingFile) return

    // File has loaded, update the tab
    const existingSession = sessions.find((sess) => sess.id === loadingFile)
    if (existingSession && existingSession.fileContent === "Loading...") {
      // Remove and re-add with updated content
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

  return { handleFileClick }
}
