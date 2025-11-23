import { useState } from "react"
import { ChatInput } from "./chat-input.component"
import { ChatSidebar } from "./chat-sidebar.component"
import { SessionBar } from "@/features/session/components/session-bar.component"
import { SessionContent } from "@/features/session/components/session.component"
import { MessageProvider } from "@/features/message"
import { useActiveSessionId } from "@/features/session"
import { SandboxNavbar } from "@/components/SandboxNavbar"
import { ActivityLog } from "@/features/activity-log"

export function ChatComponent() {
    const activeSessionId = useActiveSessionId()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(true)

    const handleMaximize = () => {
        // Close both sidebars for maximized view
        setIsSidebarOpen(false)
        setIsActivityLogOpen(false)
    }

    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const handleToggleActivityLog = () => {
        setIsActivityLogOpen(!isActivityLogOpen)
    }

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {isSidebarOpen && <ChatSidebar />}

            <div className="flex-1 flex min-w-0 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Sandbox Navbar - shows sandbox-related info */}
                    <SandboxNavbar 
                        onMaximize={handleMaximize}
                        onToggleSidebar={handleToggleSidebar}
                        isSidebarOpen={isSidebarOpen}
                        onToggleActivityLog={handleToggleActivityLog}
                        isActivityLogOpen={isActivityLogOpen}
                    />

                    {/* Session Bar */}
                    <SessionBar />

                    {/* Content area */}
                    <div className="flex-1 relative overflow-hidden">
                        {/* Main content - scrollable */}
                        <div className="absolute inset-0 overflow-y-auto pb-48">
                            <MessageProvider sessionId={activeSessionId}>
                                <SessionContent />
                            </MessageProvider>
                        </div>

                        {/* Floating chat input - always visible at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                            <div className="pointer-events-auto">
                                <ChatInput />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Log - Right side panel */}
                {isActivityLogOpen && (
                    <MessageProvider sessionId={activeSessionId}>
                        <ActivityLog />
                    </MessageProvider>
                )}
            </div>
        </div>
    )
}
