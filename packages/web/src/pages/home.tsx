import { useEffect } from "react"
import { SandboxCreatorComponent, useLoadSandboxConfig } from "@/features/sandbox-creator"
import { DemoSection } from "@/components/DemoSection"

export default function HomePage() {
  const loadConfig = useLoadSandboxConfig()

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return (
    <div className="flex flex-col items-center overflow-hidden">
      <SandboxCreatorComponent />
      <DemoSection />
    </div>
  )
}
