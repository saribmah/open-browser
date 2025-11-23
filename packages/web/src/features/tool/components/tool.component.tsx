import type { ToolPart } from "@/client/sandbox"
import { EditTool } from "@/features/tool"

interface ToolProps {
  tool: ToolPart
}

/**
 * Tool component that renders different tool types
 */
export function Tool({ tool }: ToolProps) {
  // Handle edit, write, and bash tools with the same EditTool component
  // They all have similar structure (filePath in input)
  if (tool.tool === 'edit' || tool.tool === 'write' || tool.tool === 'bash' || tool.tool === 'read') {
    return <EditTool tool={tool} />
  }

  // For other tool types, return null for now
  return null
}
