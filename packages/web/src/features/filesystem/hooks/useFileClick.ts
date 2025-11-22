import { useState, useEffect } from "react"
import type { FileNode } from "@/features/filesystem"
import type { UISession } from "@/features/session/session.store"
import {
  useSessions,
  useAddUISession,
  useUpdateUISession,
  useSetActiveSession,
} from "@/features/session"
import { useReadFile, useCurrentFile } from "@/features/filesystem"

/**
 * Hook to handle file click functionality
 * Manages file tab creation, loading state, and content fetching
 */
export function useFileClick() {
  const [loadingFile, setLoadingFile] = useState<string | null>(null)

  // Get session state and actions
  const sessions = useSessions()
  const addSession = useAddUISession()
  const updateSession = useUpdateUISession()
  const setActiveSession = useSetActiveSession()

  // Get filesystem actions
  const readFile = useReadFile()
  const currentFile = useCurrentFile()

  // Watch for file loading completion and update tab
  useEffect(() => {
    if (!loadingFile || !currentFile || currentFile.path !== loadingFile) return

    // File has loaded, update the tab with actual content
    const existingSession = sessions.find((sess) => sess.id === loadingFile)
    if (existingSession && existingSession.fileContent === "Loading...") {
      updateSession(loadingFile, {
        fileContent: currentFile.content,
      })
    }

    setLoadingFile(null)
  }, [currentFile, loadingFile, sessions, updateSession])

  const handleFileClick = async (file: FileNode) => {
    // Use the file path directly (already includes full path from root)
    const filePath = file.path

    // Check if tab already exists for this file
    const existingSession = sessions.find((sess) => sess.id === filePath)
    if (existingSession) {
      setActiveSession(existingSession.id)
      return
    }

    // Create tab with loading state
    const newSession: UISession = {
      id: filePath,
      title: file.name,
      type: "file",
      fileContent: "Loading...",
      filePath: filePath,
    }
    addSession(newSession)
    setLoadingFile(filePath)

    // Fetch file content - useEffect will update the tab when loaded
    readFile(filePath)
  }

  return { handleFileClick }
}
