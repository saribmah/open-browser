import { useState } from "react"
import { Plus, FolderGit2, FileText, Folder } from "lucide-react"
import { Sidebar } from "@/components/Sidebar"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/spinner"
import { useProjects, useGetAllProjects, useAddProject } from "@/features/project"
import { FileTreeManager } from "@/features/filesystem/components/file-tree-manager.component"
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

interface ChatSidebarProps {
  onClose?: () => void
}

/**
 * Chat sidebar component
 * Handles project management and file tree display
 */
export function ChatSidebar({ onClose }: ChatSidebarProps = {}) {
  const [url, setUrl] = useState("")
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get project state and actions
  const projects = useProjects()
  const getAllProjects = useGetAllProjects()
  const addProject = useAddProject()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!url || isSubmitting) return

    setIsSubmitting(true)
    try {
      const success = await addProject({
        url,
      })

      if (success) {
        // Refresh projects list
        getAllProjects()
        setUrl("")
        setIsAddingProject(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddClick = () => {
    setIsAddingProject(!isAddingProject)
  }

  const handleCollapse = () => {
    // When chevron is clicked, call the parent's onClose to fully hide the sidebar
    if (onClose) {
      onClose()
    }
  }

  return (
    <Sidebar collapsed={false} onCollapsedChange={handleCollapse}>
      {/* Full Content */}
      <div className="h-full overflow-hidden flex flex-col">
        {/* Explorer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Explorer</span>
          <button
            onClick={handleAddClick}
            className={cn(
              "p-1 rounded-md transition-all duration-200",
              isAddingProject 
                ? "bg-zinc-800 text-zinc-100 rotate-45" 
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            )}
            aria-label="add project"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Add Project Form - Slide Down */}
          {isAddingProject && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
                <div className="flex items-center gap-2 mb-2 text-xs font-medium text-zinc-300">
                  <FolderGit2 className="h-3 w-3 text-blue-400" />
                  <span>Clone Repository</span>
                </div>
                <form onSubmit={handleSubmit} className="space-y-2">
                  <Input
                    autoFocus
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 font-mono"
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProject(false)}
                      className="px-2 py-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] rounded font-medium transition-colors h-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isSubmitting && <Spinner className="size-3" />}
                      Clone Project
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* File Tree Content */}
          {projects.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-zinc-600">
              <div className="text-center">
                <FolderGit2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No projects yet</p>
                <p className="text-xs text-zinc-700 mt-1">Click + to add a project</p>
              </div>
            </div>
          ) : (
            <FileTreeManager />
          )}
        </div>
      </div>
    </Sidebar>
  )
}
