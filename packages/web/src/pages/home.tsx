import { Hero } from "@/components/Hero"
import { DemoSection } from "@/components/DemoSection"
import { SandboxProvider } from "@/features/sandbox"

export default function HomePage() {
  return (
    <SandboxProvider>
      <div className="flex flex-col items-center overflow-hidden">
        <Hero />
        <DemoSection />
      </div>
    </SandboxProvider>
  )
}
