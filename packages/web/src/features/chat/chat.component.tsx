import { useState, useMemo, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ContextItem } from "@/components/ContextItem"
import { ChatInput } from "@/components/ChatInput"
import { TabBar } from "@/components/TabBar"
import { CommandDialog } from "@/components/CommandDialog"
import { Code } from "@/components/Code"
import { sampleFileContents } from "@/data/sampleData"
import type { Context } from "@/components/ContextItem"
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
  type ProjectType,
} from "@/features/project"
import { useSandboxClient } from "@/features/sandbox"

export function ChatComponent() {
  const [commandOpen, setCommandOpen] = useState(false)
  
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
  const sandboxClient = useSandboxClient()

  // Load projects on mount
  useEffect(() => {
    if (sandboxClient) {
      getAllProjects(sandboxClient)
    }
  }, [sandboxClient, getAllProjects])

  // Convert projects to Context format for UI
  const contexts = useMemo<Context[]>(() => {
    return projects.map((project) => ({
      id: project.id,
      name: project.directory,
      files: [], // TODO: Load files from project
    }))
  }, [projects])

  const handleAddContext = async (url: string) => {
    if (!sandboxClient) {
      console.error("Sandbox client not available")
      return
    }

    console.log("Adding project:", url)
    
    // Parse URL to determine type
    // TODO: Better URL parsing logic
    const type: ProjectType = url.includes("github.com") ? "GITHUB" : "ARXIV"
    const directory = url.split("/").pop() || "project"

    const success = await addProject(
      {
        url,
        type,
        directory: `/workspace/${directory}`,
      },
      sandboxClient
    )

    if (success) {
      // Refresh projects list
      getAllProjects(sandboxClient)
    }
  }

  const handleDeleteContext = async (id: string) => {
    if (!sandboxClient) {
      console.error("Sandbox client not available")
      return
    }

    const success = await removeProject(id, sandboxClient)
    
    if (!success) {
      console.error("Failed to remove project")
    }
    // Project list is automatically updated by the store
  }

  const handleSendMessage = (message: string, mentionedFiles?: MentionFile[]) => {
    sendMessage(message, mentionedFiles)
  }

  // Convert context files to MentionFile format
  const availableFiles = useMemo<MentionFile[]>(() => {
    return contexts.flatMap((context) =>
      context.files.map((file) => ({
        id: `${context.id}-${file.path}`,
        name: file.name,
        path: `${context.name}${file.path}`,
        type: "file" as const,
      }))
    )
  }, [contexts])

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

  const handleFileClick = (file: FileNode) => {
    // Check if tab already exists for this file
    const existingTab = tabs.find((tab) => tab.id === file.path)
    if (existingTab) {
      setActiveTab(existingTab.id)
      return
    }

    // Get file content from sample data
    const content = sampleFileContents[file.path] || `// content for ${file.path}`

    // Create new tab for the file
    const newTab: Tab = {
      id: file.path,
      title: file.name,
      type: "file",
      fileContent: content,
      filePath: file.path,
    }
    addTab(newTab)
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
          contexts={contexts.map(c => ({ id: c.id, name: c.name }))}
        >
          {projects.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">
              no projects added yet. click "add context" to get started.
            </div>
          ) : (
            <div>
              {contexts.map((context) => (
                <ContextItem
                  key={context.id}
                  context={context}
                  onDelete={handleDeleteContext}
                  onFileClick={handleFileClick}
                />
              ))}
            </div>
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
