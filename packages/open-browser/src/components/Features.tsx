import { Github, BookOpen, MessageSquare, Globe } from "lucide-react"

const features = [
  {
    title: "open-github.com",
    description:
      "Add 'open-' to any GitHub URL to launch an AI-powered environment that understands the entire codebase. Ask questions, explore dependencies, and understand complex code instantly.",
    icon: Github,
    color: "text-white",
  },
  {
    title: "open-arxiv.org",
    description:
      "Turn dense academic papers into interactive conversations. Ask questions, summarize sections, and extract key data instantly with AI assistance.",
    icon: BookOpen,
    color: "text-red-400",
  },
  {
    title: "Context Aware AI",
    description:
      "The sandbox automatically ingests the content of the page—whether it's code, text, or data—so you can start chatting immediately with full context.",
    icon: MessageSquare,
    color: "text-green-400",
  },
  {
    title: "Universal Sandbox",
    description:
      "Works on any device with a browser. No local setup, no environment variables, no dependency hell. Just add 'open-' and you're ready to go.",
    icon: Globe,
    color: "text-blue-400",
  },
]

export function Features() {
  return (
    <section id="features" className="w-full py-24 border-t border-white/10 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 md:text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">
            One prefix. <br />
            <span className="text-zinc-500">Infinite possibilities.</span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Open-browser.ai bridges the gap between static web content and active AI assistance. It's the fastest way to
            understand complex information.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <feature.icon className={`h-32 w-32 ${feature.color}`} />
              </div>

              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-black border border-white/10 flex items-center justify-center mb-6">
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>

                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-md">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
