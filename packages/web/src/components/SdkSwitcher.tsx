import { useState } from "react"
import { Code2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type SdkType = "opencode" | "claude-code"

interface SdkSwitcherProps {
  defaultSdk?: SdkType
  onSdkChange?: (sdk: SdkType) => void
}

export function SdkSwitcher({ defaultSdk = "opencode", onSdkChange }: SdkSwitcherProps) {
  const [selectedSdk, setSelectedSdk] = useState<SdkType>(defaultSdk)
  const [isOpen, setIsOpen] = useState(false)

  const sdks: { value: SdkType; label: string }[] = [
    { value: "opencode", label: "opencode" },
    { value: "claude-code", label: "claude code" },
  ]

  const handleSelect = (sdk: SdkType) => {
    setSelectedSdk(sdk)
    setIsOpen(false)
    onSdkChange?.(sdk)
  }

  const currentSdk = sdks.find((sdk) => sdk.value === selectedSdk)

  return (
    <div className="relative">
      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          {/* Menu */}
          <div className="absolute bottom-full mb-2 left-0 w-full bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20">
            {sdks.map((sdk) => (
              <button
                key={sdk.value}
                onClick={() => handleSelect(sdk.value)}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm transition-colors",
                  selectedSdk === sdk.value
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {sdk.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-white"
      >
        <Code2 className="h-4 w-4" />
        <span>{currentSdk?.label}</span>
        <ChevronDown className="h-3 w-3 text-zinc-400" />
      </button>
    </div>
  )
}
