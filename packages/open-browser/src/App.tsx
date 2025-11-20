import { Navbar } from "./components/Navbar"
import { Hero } from "./components/Hero"
import { Features } from "./components/Features"
import { DemoSection } from "./components/DemoSection"
import { Footer } from "./components/Footer"

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center overflow-hidden">
      <Navbar />
      <Hero />
      <DemoSection />
      <Features />
      <Footer />
    </main>
  )
}
