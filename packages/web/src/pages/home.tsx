import { SandboxCreatorComponent } from "@/features/sandbox-creator"
import { DemoSection } from "@/components/DemoSection"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center overflow-hidden">
      <SandboxCreatorComponent />
      <DemoSection />
    </div>
  )
}
