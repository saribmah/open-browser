import { FileTree } from "@/features/filesystem/components/file-tree.component"
import { useFileTree } from "@/features/filesystem"
import { useFileClick } from "@/features/filesystem/hooks/useFileClick"

/**
 * Manages file tree for the workspace
 * Uses the file tree loaded by FilesystemProvider and displays it directly
 */
export function FileTreeManager() {
  const { handleFileClick } = useFileClick()

  // Get file tree from filesystem store (already loaded by FilesystemProvider)
  const fileTree = useFileTree()

  if (!fileTree) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        Loading files...
      </div>
    )
  }

  if (!fileTree.children || fileTree.children.length === 0) {
    return (
      <div className="p-4 text-sm text-zinc-500">
        No files found
      </div>
    )
  }

  return (
    <div className="pb-2">
      <FileTree
        nodes={fileTree.children}
        level={0}
        onFileClick={handleFileClick}
      />
    </div>
  )
}
