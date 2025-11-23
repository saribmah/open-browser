import { useState } from "react"
import { ChatInput } from "./chat-input.component"
import { ChatSidebar } from "./chat-sidebar.component"
import { SessionBar } from "@/features/session/components/session-bar.component"
import { SessionContent } from "@/features/session/components/session.component"
import { MessageProvider } from "@/features/message"
import { useActiveSessionId } from "@/features/session"
import { SandboxNavbar } from "@/components/SandboxNavbar"

export function ChatComponent() {
    const activeSessionId = useActiveSessionId()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const handleMaximize = () => {
        // TODO: Implement maximize functionality
        console.log("Maximize clicked")
    }

    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {isSidebarOpen && <ChatSidebar />}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Sandbox Navbar - shows sandbox-related info */}
                <SandboxNavbar 
                    onMaximize={handleMaximize}
                    onToggleSidebar={handleToggleSidebar}
                    isSidebarOpen={isSidebarOpen}
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
        </div>
    )
}
