import type { ToolPart } from "@/client/sandbox"
import { EditTool } from "@/features/tool"

interface ToolProps {
  tool: ToolPart
}

/**
 * Tool component that renders different tool types
 */
export function Tool({ tool }: ToolProps) {
  // Handle edit tool
  if (tool.tool === 'edit') {
    return <EditTool tool={tool} />
  }

  // Handle other tool types (write, bash, etc.) can be added here
  // For now, return null for unsupported tools
  return null
}
