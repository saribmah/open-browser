import { useState } from "react"
import { Plus, FolderGit2, FileText, Folder } from "lucide-react"
import { Sidebar } from "@/components/Sidebar"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useProjects, useGetAllProjects, useAddProject } from "@/features/project"
import { FileTreeManager } from "@/features/file"
import { cn } from "@/lib/utils"
import type { FormEvent } from "react"

function getProjectIcon(name: string) {
  const lowerName = name.toLowerCase()
  if (lowerName.includes("github.com")) {
    return <FolderGit2 className="h-4 w-4" />
  }
  if (lowerName.includes("arxiv.org")) {
    return <FileText className="h-4 w-4" />
  }
  return <Folder className="h-4 w-4" />
}

/**
 * Chat sidebar component
 * Handles project management and file tree display
 */
export function ChatSidebar() {
  const [url, setUrl] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Get project state and actions
  const projects = useProjects()
  const getAllProjects = useGetAllProjects()
  const addProject = useAddProject()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!url) return

    console.log("Adding project:", url)

    const success = await addProject({
      url,
    })

    if (success) {
      // Refresh projects list
      getAllProjects()
      setUrl("")
    }
  }

  return (
    <Sidebar collapsed={isCollapsed} onCollapsedChange={setIsCollapsed}>
      {/* Collapsed View - Icons Only */}
      {isCollapsed && (
        <div className="h-full flex flex-col items-center pt-[22px] gap-2">
          {/* Add button */}
          <button
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="add project"
          >
            <Plus className="h-4 w-4" />
          </button>

          {/* Project icons */}
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setIsCollapsed(false)}
              className="h-8 w-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title={project.directory}
            >
              {getProjectIcon(project.directory)}
            </button>
          ))}
        </div>
      )}

      {/* Expanded View - Full Content */}
      <div
        className={cn(
          "h-full overflow-hidden transition-opacity duration-300 flex flex-col",
          isCollapsed ? "opacity-0 invisible" : "opacity-100 visible"
        )}
      >
        {/* Add Project Input */}
        <div className="h-[72px] flex items-center px-4 shrink-0">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2 w-full">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="add url..."
              className="h-8 px-4 rounded-full bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-sm"
            />
            <Button
              type="submit"
              className="h-8 w-8 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* File Tree Content */}
        <div className="flex-1 overflow-y-auto">
          {projects.length !== 0 && (
              <FileTreeManager />
          )}
        </div>
      </div>
    </Sidebar>
  )
}
