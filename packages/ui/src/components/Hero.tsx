import { Button } from "@/components/ui/Button"
import { Sparkles, ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 w-full max-w-6xl mx-auto text-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/5 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none" />

      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-400 mb-8 backdrop-blur-sm">
        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <span>AI Sandbox Public Beta</span>
      </div>

      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent pb-4">
        The web, <br />
        <span className="text-white">open-ed by AI.</span>
      </h1>

      <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed text-balance">
        Just add <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">open-</code> to the
        start of any URL to boot up an instant AI sandbox. Chat with code, papers, and docs without leaving your
        browser.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button className="w-full sm:w-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          Try open-github.com
        </Button>
        <Button variant="outline" className="w-full sm:w-auto">
          View Documentation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mt-12 flex items-center justify-center gap-8 text-zinc-500 text-sm">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Secure Sandbox</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          <span>Instant Load</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
          </svg>
          <span>Universal Support</span>
        </div>
      </div>
    </section>
  )
}
