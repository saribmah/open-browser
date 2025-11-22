import { ChatInput } from "./chat-input.component"
import { ChatSidebar } from "./chat-sidebar.component"
import { SessionBar } from "@/features/session"
import { SessionContent } from "@/features/session/session.component"

export function ChatComponent() {

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <ChatSidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Session Bar */}
                <SessionBar />

                {/* Content area */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Main content - scrollable */}
                    <div className="absolute inset-0 overflow-y-auto pb-48">
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
        </div>
    )
}
