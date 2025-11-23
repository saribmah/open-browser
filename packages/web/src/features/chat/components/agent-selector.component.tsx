import { useMemo } from "react"
import { useInstanceContext } from "@/features/instance"
import { useOpenSpotlight } from "@/features/spotlight/spotlight.context"

interface AgentSelectorProps {
  selectedAgent?: string | null
  onAgentChange?: (agentName: string) => void
}

export function AgentSelector({
  selectedAgent,
  onAgentChange,
}: AgentSelectorProps) {
  const agents = useInstanceContext((s) => s.agent)
  const openSpotlight = useOpenSpotlight()

  // Filter to only show agents with mode "primary" or "all"
  const availableAgents = useMemo(() => {
    if (!agents || !Array.isArray(agents)) return []
    
    return agents.filter(
      (agent) => agent.mode === "primary" || agent.mode === "all"
    )
  }, [agents])

  // Determine the default agent (first primary agent)
  const defaultAgent = useMemo(() => {
    const primaryAgent = availableAgents.find((a) => a.mode === "primary")
    return primaryAgent ? primaryAgent.name : availableAgents[0]?.name || null
  }, [availableAgents])

  // Get current agent (use selected, then default)
  const currentAgentName = selectedAgent || defaultAgent
  const currentAgent = currentAgentName
    ? availableAgents.find((a) => a.name === currentAgentName)
    : undefined

  const handleClick = () => {
    openSpotlight('agents')
  }

  // Don't render if no agents available
  if (availableAgents.length === 0) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
      style={
        currentAgent?.color
          ? {
              borderLeft: `2px solid ${currentAgent.color}`,
              paddingLeft: "0.625rem",
            }
          : undefined
      }
    >
      <span>{currentAgent?.name || "Select agent"}</span>
    </button>
  )
}
