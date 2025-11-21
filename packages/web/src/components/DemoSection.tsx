import { useState, useEffect } from "react"
import { Search, Github, Bot, Send, FileCode, Sparkles } from "lucide-react"

export function DemoSection() {
  const [text, setText] = useState("github.com/vercel/next.js")
  const [step, setStep] = useState(0) // 0: initial, 1: typing, 2: loading, 3: active

  useEffect(() => {
    const loop = async () => {
      // Reset
      setStep(0)
      setText("github.com/vercel/next.js")
      await new Promise((r) => setTimeout(r, 2000))

      // Start typing "open-"
      setStep(1)
      const prefix = "open-"
      for (let i = 1; i <= prefix.length; i++) {
        setText(prefix.slice(0, i) + "github.com/vercel/next.js")
        await new Promise((r) => setTimeout(r, 150))
      }

      // Loading state
      await new Promise((r) => setTimeout(r, 500))
      setStep(2)

      // Active state
      await new Promise((r) => setTimeout(r, 1500))
      setStep(3)

      // Hold active state
      await new Promise((r) => setTimeout(r, 6000))
    }

    loop()
    const interval = setInterval(loop, 11000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="w-full px-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden">
          {/* Browser Chrome */}
          <div className="flex items-center gap-4 border-b border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex w-full max-w-lg items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/10 hover:border-white/20">
                <Search className="h-3.5 w-3.5" />
                <span className="font-mono text-white">
                  {step === 1 ? (
                    <>
                      <span className="text-blue-400">open-</span>
                      {text.replace("open-", "")}
                    </>
                  ) : (
                    text
                  )}
                </span>
                {step === 1 && <span className="h-4 w-0.5 bg-blue-500 animate-pulse" />}
              </div>
            </div>
            <div className="w-16" />
          </div>

          {/* Browser Content */}
          <div className="relative h-[500px] w-full bg-black overflow-hidden">
            {step < 2 ? (
              // Standard GitHub View (Mock)
              <div className="w-full h-full bg-[#0D1117] p-8 flex flex-col items-center justify-center opacity-50">
                <Github className="h-16 w-16 text-white/20 mb-4" />
                <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                <div className="h-3 w-48 bg-white/5 rounded" />
              </div>
            ) : step === 2 ? (
              // Loading State
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-blue-400" />
                  </div>
                </div>
                <p className="mt-4 text-zinc-400 font-mono text-sm animate-pulse">Booting AI Sandbox...</p>
              </div>
            ) : (
              // AI Sandbox View
              <div className="w-full h-full flex">
                {/* Left Panel: Code Viewer */}
                <div className="w-2/3 border-r border-white/10 bg-[#0D1117] flex flex-col">
                  <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-[#010409]">
                    <FileCode className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-zinc-400">next.js / packages / core / index.ts</span>
                  </div>
                  <div className="flex-1 p-4 font-mono text-xs text-zinc-400 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D1117]/90 pointer-events-none" />
                    <div className="space-y-1 opacity-70">
                      <p>
                        <span className="text-purple-400">export</span> <span className="text-blue-400">default</span>{" "}
                        <span className="text-purple-400">function</span> <span className="text-yellow-400">Next</span>
                        () {"{"}
                      </p>
                      <p className="pl-4">
                        <span className="text-zinc-500">// Core initialization logic</span>
                      </p>
                      <p className="pl-4">
                        <span className="text-purple-400">const</span> app = <span className="text-blue-400">new</span>{" "}
                        <span className="text-yellow-400">App</span>();
                      </p>
                      <p className="pl-4">
                        <span className="text-purple-400">await</span> app.
                        <span className="text-blue-400">prepare</span>();
                      </p>
                      <p className="pl-4">
                        <span className="text-purple-400">return</span> app;
                      </p>
                      <p>{"}"}</p>
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-3 w-full bg-white/5 rounded animate-pulse"
                          style={{ width: `${Math.random() * 50 + 30}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: AI Chat */}
                <div className="w-1/3 bg-black flex flex-col">
                  <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
                    <Bot className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-medium text-white">Open AI Assistant</span>
                  </div>
                  <div className="flex-1 p-4 space-y-4 overflow-hidden">
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded bg-green-500/20 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 text-green-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-300 bg-white/5 p-2 rounded-lg rounded-tl-none">
                          I've analyzed the repository. This is the core entry point for Next.js. What would you like to
                          know?
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="h-6 w-6 rounded bg-blue-500/20 flex items-center justify-center shrink-0">
                        <div className="h-3.5 w-3.5 rounded-full bg-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white bg-blue-600 p-2 rounded-lg rounded-tr-none">
                          Explain how the routing works.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded bg-green-500/20 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 text-green-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-300 bg-white/5 p-2 rounded-lg rounded-tl-none">
                          The routing system uses a file-system based router built on top of...
                        </p>
                        <div className="h-2 w-12 bg-white/10 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-white/10">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ask about this repo..."
                        className="w-full bg-white/5 border border-white/10 rounded-md py-1.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-white/20"
                      />
                      <Send className="absolute right-2 top-1.5 h-3.5 w-3.5 text-zinc-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
