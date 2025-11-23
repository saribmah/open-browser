import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSandboxConfig } from "@/features/sandbox-creator"
import { useSandboxContext } from "@/features/sandbox"
import opencodeLogoUrl from "@/assets/icons/opencode-logo.svg"
import claudeCodeLogoUrl from "@/assets/icons/claude-code-logo.svg"

interface SdkOption {
  id: string
  name: string
  iconUrl: string
}

interface SdkSelectorProps {
  selectedSdk?: string
  onSdkChange?: (sdkId: string) => void
}

// Map SDK types to display names and icon URLs
const SDK_CONFIG: Record<string, { name: string; iconUrl: string }> = {
  OPENCODE: { name: "OpenCode", iconUrl: opencodeLogoUrl },
  CLAUDE_CODE: { name: "Claude Code", iconUrl: claudeCodeLogoUrl },
  opencode: { name: "OpenCode", iconUrl: opencodeLogoUrl },
  "claude-code": { name: "Claude Code", iconUrl: claudeCodeLogoUrl },
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
        { id: "opencode", name: "OpenCode", iconUrl: opencodeLogoUrl },
        { id: "claude-code", name: "Claude Code", iconUrl: claudeCodeLogoUrl },
      ]
    }

    // Find the provider config
    const providerConfig = config.providers.find(
      (p) => p.name === currentProvider
    )

    if (!providerConfig) {
      // Fallback if provider not found
      return [
        { id: "opencode", name: "OpenCode", iconUrl: opencodeLogoUrl },
        { id: "claude-code", name: "Claude Code", iconUrl: claudeCodeLogoUrl },
      ]
    }

    // Map SDK types to options
    return providerConfig.sdks.map((sdk) => {
      const sdkConfig = SDK_CONFIG[sdk] || SDK_CONFIG[normalizeSdkId(sdk)]
      return {
        id: normalizeSdkId(sdk),
        name: sdkConfig?.name || sdk,
        iconUrl: sdkConfig?.iconUrl || opencodeLogoUrl,
      }
    })
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
        className="flex items-center p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
      >
        <img 
          src={currentSdk?.iconUrl} 
          alt={currentSdk?.name}
          className="h-4 w-4"
        />
      </button>

      {/* SDK dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 min-w-[160px]">
            {availableSdks.map((sdk) => (
              <button
                key={sdk.id}
                type="button"
                onClick={() => handleSdkSelect(sdk.id)}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2",
                  normalizeSdkId(selectedSdk) === normalizeSdkId(sdk.id)
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <img 
                  src={sdk.iconUrl} 
                  alt={sdk.name}
                  className="h-4 w-4"
                />
                <span>{sdk.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
