import { useState, useMemo } from "react"
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
  useContexts,
  useAddTab,
  useRemoveTab,
  useSetActiveTab,
  useAddContext,
  useRemoveContext,
  useSendMessage,
} from "./chat.context"

export function ChatComponent() {
  const [commandOpen, setCommandOpen] = useState(false)
  
  // Get state from store
  const tabs = useTabs()
  const activeTabId = useActiveTabId()
  const activeTab = useActiveTab()
  const contexts = useContexts()
  
  // Get actions from store
  const addTab = useAddTab()
  const removeTab = useRemoveTab()
  const setActiveTab = useSetActiveTab()
  const addContext = useAddContext()
  const removeContext = useRemoveContext()
  const sendMessage = useSendMessage()

  const handleAddContext = (url: string) => {
    console.log("Adding context:", url)
    // TODO: Fetch and parse the URL to get context data
    const newContext: Context = {
      id: Date.now().toString(),
      name: url,
      files: [],
    }
    addContext(newContext)
  }

  const handleDeleteContext = (id: string) => {
    removeContext(id)
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
          {contexts.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">
              no context added yet. click "add context" to get started.
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
