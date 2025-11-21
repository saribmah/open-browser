import { useState, useMemo } from "react"
import { SandboxProvider } from "@/features/sandbox"
import { Sidebar } from "@/components/Sidebar"
import { ContextItem } from "@/components/ContextItem"
import { ChatInput } from "@/components/ChatInput"
import { TabBar } from "@/components/TabBar"
import { CommandDialog } from "@/components/CommandDialog"
import { Code } from "@/components/Code"
import { sampleFileContents, sampleContexts } from "@/data/sampleData"
import type { Context } from "@/components/ContextItem"
import type { Tab } from "@/components/TabBar"
import type { MentionFile } from "@/components/FileMention"
import type { FileNode } from "@/components/FileTree"

export default function Chat() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "new session", type: "chat" },
  ])
  const [activeTabId, setActiveTabId] = useState("1")
  const [commandOpen, setCommandOpen] = useState(false)

  const [contexts, setContexts] = useState<Context[]>(sampleContexts)

  const handleAddContext = (url: string) => {
    console.log("Adding context:", url)
    // TODO: Fetch and parse the URL to get context data
    const newContext: Context = {
      id: Date.now().toString(),
      name: url,
      files: [],
    }
    setContexts([...contexts, newContext])
  }

  const handleDeleteContext = (id: string) => {
    setContexts(contexts.filter((context) => context.id !== id))
  }

  const handleSendMessage = (message: string, mentionedFiles?: MentionFile[]) => {
    console.log("Sending message:", message, "with files:", mentionedFiles)
    // TODO: Implement message sending logic
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
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  const handleCloseTab = (id: string) => {
    const newTabs = tabs.filter((tab) => tab.id !== id)
    setTabs(newTabs)
    if (activeTabId === id && newTabs.length > 0) {
      const lastTab = newTabs[newTabs.length - 1]
      if (lastTab) {
        setActiveTabId(lastTab.id)
      }
    }
  }

  const handleFileClick = (file: FileNode) => {
    // Check if tab already exists for this file
    const existingTab = tabs.find((tab) => tab.id === file.path)
    if (existingTab) {
      setActiveTabId(existingTab.id)
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
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
  }

  // Get the active tab
  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  return (
    <SandboxProvider>
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
          onTabSelect={setActiveTabId}
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
    </SandboxProvider>
  )
}
