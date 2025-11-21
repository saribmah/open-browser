import { useState, useMemo } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ContextItem } from "@/components/ContextItem"
import { ChatInput } from "@/components/ChatInput"
import { TabBar } from "@/components/TabBar"
import type { Context } from "@/components/ContextItem"
import type { Tab } from "@/components/TabBar"
import type { MentionFile } from "@/components/FileMention"

export default function Chat() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "new session" },
  ])
  const [activeTabId, setActiveTabId] = useState("1")

  const [contexts, setContexts] = useState<Context[]>([
    {
      id: "1",
      name: "github.com/vercel/next.js",
      files: [
        { name: "README.md", path: "/README.md" },
        { name: "package.json", path: "/package.json" },
        { name: "tsconfig.json", path: "/tsconfig.json" },
      ],
    },
    {
      id: "2",
      name: "arxiv.org/abs/1706.03762",
      files: [
        { name: "attention-is-all-you-need.pdf", path: "/paper.pdf" },
      ],
    },
  ])

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

  return (
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
              />
            ))}
          </div>
        )}
      </Sidebar>
      
      <div className="flex-1 flex flex-col">
        {/* Tab Bar */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={setActiveTabId}
          onTabClose={handleCloseTab}
          onNewTab={handleNewTab}
        />

        {/* Chat content area */}
        <div className="flex-1 relative">
          {/* Chat messages area */}
          <div className="h-full overflow-y-auto p-8 pb-32">
            <div className="flex items-center justify-center h-full text-zinc-400">
              <p>start a conversation...</p>
            </div>
          </div>

        {/* Floating chat input */}
        <ChatInput onSend={handleSendMessage} availableFiles={availableFiles} />
        </div>
      </div>
    </div>
  )
}
