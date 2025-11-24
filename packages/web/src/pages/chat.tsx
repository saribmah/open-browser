import { useParams } from "react-router"
import { SandboxProvider } from "@/features/sandbox"
import { ChatProvider } from "@/features/chat"
import {SpotlightComponent} from "@/features/spotlight/components/spotlight.component";
import {ChatComponent} from "@/features/chat/components/chat.component.tsx";

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
