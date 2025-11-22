import { useParams } from "react-router"
import { SandboxProvider } from "@/features/sandbox"
import { ChatProvider, ChatComponent } from "@/features/chat"
import {SpotlightComponent} from "@/features/spotlight";

export default function Chat() {
  const params = useParams<{ sandboxId?: string }>()
  const sandboxId = params.sandboxId

  return (
    <SandboxProvider sandboxId={sandboxId}>
      <ChatProvider>
        <SpotlightComponent />
        <ChatComponent />
      </ChatProvider>
    </SandboxProvider>
  )
}
