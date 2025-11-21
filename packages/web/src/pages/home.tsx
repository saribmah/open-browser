import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { DemoSection } from "@/components/DemoSection"
import { Footer } from "@/components/Footer"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center overflow-hidden">
      <Hero />
      <DemoSection />
    </div>
  )
}
