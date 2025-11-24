import { useState } from "react"
import { ChatInput } from "./chat-input.component"
import { ChatSidebar } from "./chat-sidebar.component"
import { SessionBar } from "@/features/session/components/session-bar.component"
import { SessionContent } from "@/features/session/components/session.component"
import { MessageProvider } from "@/features/message"
import { useActiveSessionId, useVisibleSessions } from "@/features/session"
import { SandboxNavbar } from "@/components/SandboxNavbar"
import { ActivityLog } from "@/features/activity-log"

export function ChatComponent() {
    const activeSessionId = useActiveSessionId()
    const visibleSessions = useVisibleSessions()
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

            <div className="flex-1 flex min-w-0 overflow-hidden">
                {/* Main content area with navbar, session bar, and sessions */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Sandbox Navbar - shows sandbox-related info */}
                    <SandboxNavbar
                        onMaximize={handleMaximize}
                        onToggleSidebar={handleToggleSidebar}
                        isSidebarOpen={isSidebarOpen}
                        onToggleActivityLog={handleToggleActivityLog}
                        isActivityLogOpen={isActivityLogOpen}
                    />

                    {/* Session Bar and Content area wrapper */}
                    <div className="flex-1 flex min-w-0 overflow-hidden">
                        {isSidebarOpen && <ChatSidebar onClose={() => setIsSidebarOpen(false)} />}
                        {/* Render all sessions with their MessageProviders */}
                        {visibleSessions.map((session) => (
                            <MessageProvider key={session.id} sessionId={session.id}>
                                <div
                                    className={`flex-1 flex min-w-0 overflow-hidden ${session.id === activeSessionId ? 'flex' : 'hidden'}`}
                                >
                                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                                        {/* Session Bar */}
                                        <SessionBar />

                                        {/* Content area */}
                                        <div className="flex-1 relative overflow-hidden">
                                            <div className="absolute inset-0 overflow-y-auto">
                                                <SessionContent />
                                            </div>

                                            {/* Floating chat input - always visible at bottom */}
                                            <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                                                <div className="pointer-events-auto">
                                                    <ChatInput />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activity Log - Right side panel - shares same MessageProvider */}
                                    {isActivityLogOpen && <ActivityLog />}
                                </div>
                            </MessageProvider>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
