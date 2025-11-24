import { useEffect } from "react"
import {
  SandboxCreatorComponent,
  useLoadSandboxConfig,
} from "@/features/sandbox-creator"

export default function HomePage() {
  const loadConfig = useLoadSandboxConfig()

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return (
    <div className="flex flex-col items-center overflow-hidden">
      <SandboxCreatorComponent />
    </div>
  )
}
