import { Sidebar } from "@/components/Sidebar"
import { useProjects, useGetAllProjects, useAddProject } from "@/features/project"
import { FileTreeManager } from "@/features/file"

/**
 * Chat sidebar component
 * Handles project management and file tree display
 */
export function ChatSidebar() {
  // Get project state and actions
  const projects = useProjects()
  const getAllProjects = useGetAllProjects()
  const addProject = useAddProject()

  const handleAddContext = async (url: string) => {
    console.log("Adding project:", url)

    const success = await addProject({
      url,
    })

    if (success) {
      // Refresh projects list
      getAllProjects()
    }
  }

  return (
    <Sidebar
      onAddContext={handleAddContext}
      contexts={projects.map(p => ({ id: p.id, name: p.directory }))}
    >
      {projects.length === 0 ? (
        <div className="p-4 text-sm text-zinc-500">
          no projects added yet. click "add context" to get started.
        </div>
      ) : (
        <FileTreeManager />
      )}
    </Sidebar>
  )
}
