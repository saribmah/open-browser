import { useMemo, useEffect } from "react"
import { useInstanceContext } from "@/features/instance"
import { useOpenSpotlight } from "@/features/spotlight/spotlight.context"
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
  const providers = useInstanceContext((s) => s.providers)
  const sdkConfig = useInstanceContext((s) => s.sdkConfig)
  const openSpotlight = useOpenSpotlight()

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
        const foundModel = models.find((m) => m.id === configModel)
        // Only use config model if it exists in the available models
        if (foundModel) {
          return foundModel
        }
      }
    }

    // Fall back to first model from providers
    return models[0] || null
  }, [sdkConfig, models])

  // Get current model (use selected, then default)
  const currentModel = selectedModel
    ? models.find((m) => m.id === selectedModel.modelID && m.providerId === selectedModel.providerID)
    : defaultModel

  // Set the default model in the store when it's determined and no model is selected
  useEffect(() => {
    if (!selectedModel && defaultModel && onModelChange) {
      onModelChange({
        providerID: defaultModel.providerId,
        modelID: defaultModel.id,
      })
    }
  }, [defaultModel, selectedModel, onModelChange])

  const handleClick = () => {
    openSpotlight('models')
  }

  // Don't render if no models available
  if (models.length === 0) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
    >
      <span>{currentModel?.name || "Select model"}</span>
    </button>
  )
}
