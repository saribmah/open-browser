import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Search, Loader2 } from "lucide-react"
import type { FormEvent } from "react"
import { postSandbox } from "@/client/api/sdk.gen"
import type { PostSandboxResponses } from "@/client/api/types.gen"

function parseUrl(url: string): { type: 'GITHUB' | 'ARXIV'; directory: string } | null {
  if (url.includes('github.com')) {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match && match[2]) {
      return { type: 'GITHUB', directory: match[2] };
    }
  }
  if (url.includes('arxiv.org')) {
    const match = url.match(/arxiv\.org\/abs\/([^/]+)/);
    if (match && match[1]) {
      return { type: 'ARXIV', directory: match[1] };
    }
  }
  return null;
}

export function Hero() {
  const navigate = useNavigate()
  const [url, setUrl] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!url) return

    const parsed = parseUrl(url)
    if (!parsed) {
      setError("Invalid URL. Please enter a valid GitHub or arXiv URL.")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const result = await postSandbox({
        body: {
          url,
          type: parsed.type,
          directory: parsed.directory,
          sdkType: 'OPENCODE',
          provider: 'local',
        }
      })

      if (result.error) {
        setError((result.error as { error?: string })?.error || "Failed to create sandbox")
        setIsCreating(false)
        return
      }

      const data = result.data as PostSandboxResponses[200]
      if (data?.sandbox) {
        navigate(`/chat/${data.sandbox.id}`)
      } else {
        setError("No sandbox returned")
        setIsCreating(false)
      }
    } catch (err: any) {
      setError(err.message || "Failed to create sandbox")
      setIsCreating(false)
    }
  }

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 w-full max-w-6xl mx-auto text-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/5 rounded-full blur-[120px] -z-10 opacity-50 pointer-events-none" />

      <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent pb-4">
        The web, <br />
        <span className="text-white">open-ed by AI.</span>
      </h1>

      <p className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed text-balance">
        Just add <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-sm">open-</code> to the
        start of any URL to boot up an instant AI sandbox. Chat with code, papers, and docs without leaving your
        browser.
      </p>

      <div className="mt-10 w-full max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a GitHub or Arxiv URL..."
              disabled={isCreating}
              className="h-12 pl-10 pr-24 rounded-full bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
            />
          </div>
          <Button
            type="submit"
            disabled={isCreating}
            className="absolute right-1 h-10 rounded-full bg-white text-black hover:bg-zinc-200 px-6 disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Open'}
          </Button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-zinc-500">
          <span>Try:</span>
          <button
            type="button"
            onClick={() => setUrl("https://github.com/vercel/next.js")}
            className="hover:text-white transition-colors underline decoration-zinc-700 underline-offset-2"
          >
            github.com/vercel/next.js
          </button>
          <button
            type="button"
            onClick={() => setUrl("https://arxiv.org/abs/1706.03762")}
            className="hover:text-white transition-colors underline decoration-zinc-700 underline-offset-2"
          >
            arxiv.org/abs/1706.03762
          </button>
        </div>
      </div>
    </section>
  )
}
