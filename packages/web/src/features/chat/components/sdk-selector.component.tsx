import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSandboxConfig } from "@/features/sandbox-creator"
import { useSandboxContext } from "@/features/sandbox"

interface SdkOption {
  id: string
  name: string
}

interface SdkSelectorProps {
  selectedSdk?: string
  onSdkChange?: (sdkId: string) => void
}

// Map SDK types to display names
const SDK_DISPLAY_NAMES: Record<string, string> = {
  OPENCODE: "opencode",
  CLAUDE_CODE: "claude code",
  opencode: "opencode",
  "claude-code": "claude code",
}

// Normalize SDK ID for comparison
const normalizeSdkId = (id: string): string => {
  return id.toLowerCase().replace(/_/g, "-")
}

export function SdkSelector({ selectedSdk = "opencode", onSdkChange }: SdkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const config = useSandboxConfig()
  
  // Get the current sandbox provider
  const currentProvider = useSandboxContext((state) => state.sandbox?.provider)

  // Get available SDKs based on the current provider from config
  const getAvailableSdks = (): SdkOption[] => {
    if (!config || !currentProvider) {
      // Fallback to default SDKs if config not loaded
      return [
        { id: "opencode", name: "opencode" },
        { id: "claude-code", name: "claude code" },
      ]
    }

    // Find the provider config
    const providerConfig = config.providers.find(
      (p) => p.name === currentProvider
    )

    if (!providerConfig) {
      // Fallback if provider not found
      return [
        { id: "opencode", name: "opencode" },
        { id: "claude-code", name: "claude code" },
      ]
    }

    // Map SDK types to options
    return providerConfig.sdks.map((sdk) => ({
      id: normalizeSdkId(sdk),
      name: SDK_DISPLAY_NAMES[sdk] || sdk.toLowerCase(),
    }))
  }

  const availableSdks = getAvailableSdks()
  const currentSdk = availableSdks.find((s) => normalizeSdkId(s.id) === normalizeSdkId(selectedSdk)) || availableSdks[0]

  const handleSdkSelect = (sdkId: string) => {
    onSdkChange?.(sdkId)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
      >
        <span>{currentSdk?.name}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {/* SDK dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 min-w-[120px]">
            {availableSdks.map((sdk) => (
              <button
                key={sdk.id}
                type="button"
                onClick={() => handleSdkSelect(sdk.id)}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs transition-colors",
                  normalizeSdkId(selectedSdk) === normalizeSdkId(sdk.id)
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {sdk.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
