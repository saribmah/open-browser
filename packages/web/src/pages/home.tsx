import { Hero } from "@/components/Hero"
import { DemoSection } from "@/components/DemoSection"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center overflow-hidden">
      <Hero />
      <DemoSection />
    </div>
  )
}
