import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SandboxProvider = "daytona" | "cloudflare" | "vercel"
type SandboxStatus = "active" | "inactive" | "loading"

const providers: { id: SandboxProvider; name: string }[] = [
  { id: "daytona", name: "daytona" },
  { id: "cloudflare", name: "cloudflare" },
  { id: "vercel", name: "vercel" },
]

interface NavbarProps {
  sandboxProvider?: SandboxProvider
  sandboxStatus?: SandboxStatus
  timeRemaining?: string
  onProviderChange?: (provider: SandboxProvider) => void
}

export function Navbar({ 
  sandboxProvider = "daytona",
  sandboxStatus = "inactive",
  timeRemaining,
  onProviderChange,
}: NavbarProps) {
  const [isProviderOpen, setIsProviderOpen] = useState(false)

  const getStatusColor = (status: SandboxStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-red-500'
      case 'loading':
        return 'bg-yellow-500 animate-pulse'
      default:
        return 'bg-gray-500'
    }
  }

  const currentProvider = providers.find(p => p.id === sandboxProvider) || providers[0]

  const handleProviderSelect = (providerId: SandboxProvider) => {
    onProviderChange?.(providerId)
    setIsProviderOpen(false)
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="h-6 w-6 rounded-full bg-white" />
          open-browser.ai
        </a>

        {/* Right side - Sandbox provider and GitHub */}
        <div className="flex items-center gap-4">
          {/* Sandbox provider pill */}
          <div className="relative">
            <button
              onClick={() => setIsProviderOpen(!isProviderOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs transition-colors"
            >
              <div className={cn("h-2 w-2 rounded-full", getStatusColor(sandboxStatus))} />
              <span className="text-zinc-400">{currentProvider?.name}</span>
              {timeRemaining && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-500">{timeRemaining}</span>
                </>
              )}
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {/* Provider dropdown */}
            {isProviderOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsProviderOpen(false)}
                />
                <div className="absolute top-full mt-2 right-0 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 min-w-[120px]">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderSelect(provider.id)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-xs transition-colors",
                        sandboxProvider === provider.id
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
