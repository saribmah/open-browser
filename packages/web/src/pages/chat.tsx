import { useParams } from "react-router"
import { SandboxProvider } from "@/features/sandbox"
import { ChatProvider, ChatComponent } from "@/features/chat"

export default function Chat() {
  const params = useParams<{ sandboxId?: string }>()
  const sandboxId = params.sandboxId

  return (
    <SandboxProvider sandboxId={sandboxId}>
      <ChatProvider>
        <ChatComponent />
      </ChatProvider>
    </SandboxProvider>
  )
}
