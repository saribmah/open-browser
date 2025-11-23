import { useState, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInstanceContext } from "@/features/instance"

interface AgentSelectorProps {
  selectedAgent?: string | null
  onAgentChange?: (agentName: string) => void
}

export function AgentSelector({
  selectedAgent,
  onAgentChange,
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const agents = useInstanceContext((s) => s.agent)

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

  const handleAgentSelect = (agentName: string) => {
    onAgentChange?.(agentName)
    setIsOpen(false)
  }

  // Don't render if no agents available
  if (availableAgents.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
        <ChevronDown className="h-3 w-3" />
      </button>

      {/* Agent dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
            {availableAgents.map((agent) => (
              <button
                key={agent.name}
                type="button"
                onClick={() => handleAgentSelect(agent.name)}
                className={cn(
                  "w-full px-3 py-2 text-left text-xs transition-colors",
                  currentAgentName === agent.name
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
                style={
                  agent.color
                    ? {
                        borderLeft: `2px solid ${agent.color}`,
                        paddingLeft: "0.625rem",
                      }
                    : undefined
                }
              >
                <div className="flex flex-col">
                  <span className="font-medium">{agent.name}</span>
                  {agent.description && (
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      {agent.description}
                    </span>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] text-zinc-600 uppercase">
                      {agent.mode}
                    </span>
                    {agent.builtIn && (
                      <span className="text-[9px] text-blue-500 uppercase">
                        built-in
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
