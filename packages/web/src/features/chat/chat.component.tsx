import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ChatInput } from "@/components/ChatInput"
import { TabBar } from "@/components/TabBar"
import { CommandDialog } from "@/components/CommandDialog"
import { Code } from "@/components/Code"
import type { Tab } from "@/components/TabBar"
import type { MentionFile } from "@/components/FileMention"
import type { FileNode } from "@/components/FileTree"
import {
  useTabs,
  useActiveTabId,
  useActiveTab,
  useAddTab,
  useRemoveTab,
  useSetActiveTab,
  useSendMessage,
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
} from "@/features/filesystem"
import { FileTreeManager } from "@/features/file"

export function ChatComponent() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  
  // Get state from chat store
  const tabs = useTabs()
  const activeTabId = useActiveTabId()
  const activeTab = useActiveTab()
  
  // Get actions from chat store
  const addTab = useAddTab()
  const removeTab = useRemoveTab()
  const setActiveTab = useSetActiveTab()
  const sendMessage = useSendMessage()

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
    const existingTab = tabs.find((tab) => tab.id === loadingFile)
    if (existingTab && existingTab.fileContent === "Loading...") {
      // We need an updateTab action - for now, remove and re-add
      removeTab(loadingFile)
      const updatedTab: Tab = {
        id: currentFile.path,
        title: existingTab.title,
        type: "file",
        fileContent: currentFile.content,
        filePath: currentFile.path,
      }
      addTab(updatedTab)
    }
    
    setLoadingFile(null)
  }, [currentFile, loadingFile, tabs, removeTab, addTab])

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

  const handleSendMessage = (message: string, mentionedFiles?: MentionFile[]) => {
    sendMessage(message, mentionedFiles)
  }

  // TODO: Convert project files to MentionFile format for chat input
  const availableFiles: MentionFile[] = []

  const handleNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "new session",
    }
    addTab(newTab)
  }

  const handleCloseTab = (id: string) => {
    removeTab(id)
  }

  const handleFileClick = async (file: FileNode, directory?: string) => {
    // Construct the full path: directory/filePath
    // Remove leading slash from file.path if present to avoid double slashes
    const relativePath = file.path.startsWith('/') ? file.path.slice(1) : file.path
    const fullPath = directory ? `${directory}/${relativePath}` : file.path
    
    // Check if tab already exists for this file
    const existingTab = tabs.find((tab) => tab.id === fullPath)
    if (existingTab) {
      setActiveTab(existingTab.id)
      return
    }

    // Create tab with loading state
    const newTab: Tab = {
      id: fullPath,
      title: file.name,
      type: "file",
      fileContent: "Loading...",
      filePath: fullPath,
    }
    addTab(newTab)
    setLoadingFile(fullPath)

    // Fetch file content with full path - useEffect will update the tab when loaded
    readFile(fullPath)
  }

  return (
    <>
      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNewSession={handleNewTab}
        onAddContext={() => {
          // Focus on the sidebar add context input
          setCommandOpen(false)
        }}
        onClearChat={() => {
          console.log("Clear chat")
        }}
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
            />
          )}
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tab Bar */}
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTab}
            onTabClose={handleCloseTab}
            onNewTab={handleNewTab}
          />

          {/* Content area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Main content - scrollable */}
            <div className="absolute inset-0 overflow-y-auto pb-48">
              {activeTab?.type === "file" && activeTab.fileContent ? (
                /* File viewer */
                <Code
                  file={{
                    name: activeTab.title,
                    contents: activeTab.fileContent,
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
