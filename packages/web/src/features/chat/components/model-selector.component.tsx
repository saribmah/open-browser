import { useState, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInstanceContext } from "@/features/instance"
import type { Model } from "@/features/chat/chat.store"

interface ModelSelectorProps {
  selectedModel?: Model | null
  onModelChange?: (model: Model) => void
}

interface ModelInfo {
  id: string
  name: string
  providerId: string
  providerName: string
}

export function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const providers = useInstanceContext((s) => s.providers)
  const sdkConfig = useInstanceContext((s) => s.sdkConfig)

  // Build model list from providers
  const models = useMemo(() => {
    if (!providers?.providers) return []

    const modelList: ModelInfo[] = []

    for (const provider of providers.providers) {
      if (provider.models) {
        for (const [modelId, modelData] of Object.entries(provider.models)) {
          modelList.push({
            id: modelId,
            name: (modelData as any)?.name || modelId,
            providerId: provider.id,
            providerName: provider.name,
          })
        }
      }
    }

    return modelList
  }, [providers])

  // Determine the default model
  const defaultModel = useMemo(() => {
    // First try to get model from SDK config
    if (sdkConfig && typeof sdkConfig === "object") {
      const configModel = (sdkConfig as any).model
      if (configModel && typeof configModel === "string") {
        // Find the model in our list by ID
        return models.find((m) => m.id === configModel)
      }
    }

    // Fall back to first model from providers
    return models[0] || null
  }, [sdkConfig, models])

  // Get current model (use selected, then default)
  const currentModel = selectedModel 
    ? models.find((m) => m.id === selectedModel.modelID && m.providerId === selectedModel.providerID)
    : defaultModel

  const handleModelSelect = (modelInfo: ModelInfo) => {
    const model: Model = {
      modelID: modelInfo.id,
      providerID: modelInfo.providerId,
    }
    onModelChange?.(model)
    setIsOpen(false)
  }

  // Don't render if no models available
  if (models.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
      >
        <span>{currentModel?.name || "Select model"}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {/* Model dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
            {models.map((modelInfo) => (
              <button
                key={`${modelInfo.providerId}-${modelInfo.id}`}
                type="button"
                onClick={() => handleModelSelect(modelInfo)}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs transition-colors",
                  currentModel?.id === modelInfo.id && currentModel?.providerId === modelInfo.providerId
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{modelInfo.name}</span>
                  <span className="text-[10px] text-zinc-500">
                    {modelInfo.providerName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
