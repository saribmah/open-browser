import { useMemo } from "react"
import { useSandboxConfig } from "@/features/sandbox-creator"
import { useSandboxContext } from "@/features/sandbox"
import { useOpenSpotlight } from "@/features/spotlight/spotlight.context"
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
  const config = useSandboxConfig()
  const currentProvider = useSandboxContext((state) => state.sandbox?.provider)
  const openSpotlight = useOpenSpotlight()

  // Get available SDKs based on the current provider from config
  const availableSdks = useMemo((): SdkOption[] => {
    if (!config || !currentProvider) {
      return [
        { id: "opencode", name: "OpenCode", iconUrl: opencodeLogoUrl },
        { id: "claude-code", name: "Claude Code", iconUrl: claudeCodeLogoUrl },
      ]
    }

    const providerConfig = config.providers.find(
      (p) => p.name === currentProvider
    )

    if (!providerConfig) {
      return [
        { id: "opencode", name: "OpenCode", iconUrl: opencodeLogoUrl },
        { id: "claude-code", name: "Claude Code", iconUrl: claudeCodeLogoUrl },
      ]
    }

    return providerConfig.sdks.map((sdk) => {
      const sdkConfig = SDK_CONFIG[sdk] || SDK_CONFIG[normalizeSdkId(sdk)]
      return {
        id: normalizeSdkId(sdk),
        name: sdkConfig?.name || sdk,
        iconUrl: sdkConfig?.iconUrl || opencodeLogoUrl,
      }
    })
  }, [config, currentProvider])

  const currentSdk = availableSdks.find((s) => normalizeSdkId(s.id) === normalizeSdkId(selectedSdk)) || availableSdks[0]

  const handleClick = () => {
    openSpotlight('sdks')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
    >
      <img 
        src={currentSdk?.iconUrl} 
        alt={currentSdk?.name}
        className="h-4 w-4"
      />
    </button>
  )
}
