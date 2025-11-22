import { File, Folder, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MentionFile } from "@/features/filesystem"

interface FileMentionProps {
  files: MentionFile[]
  selectedIndex: number
  onSelect: (file: MentionFile) => void
  onClose: () => void
  searchQuery: string
}

export function FileMention({ files, selectedIndex, onSelect, onClose, searchQuery }: FileMentionProps) {
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (filteredFiles.length === 0) {
    return (
      <div className="absolute bottom-full mb-2 left-4 right-4 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 shadow-lg">
        <div className="px-3 py-2 text-xs text-zinc-500">no files found</div>
      </div>
    )
  }

  return (
    <div className="absolute bottom-full mb-2 left-4 right-4 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs text-zinc-400">mention a file</span>
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-white/10 rounded transition-colors text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* File list */}
      <div className="max-h-48 overflow-y-auto">
        {filteredFiles.map((file, index) => (
          <button
            key={file.path}
            onClick={() => onSelect(file)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
              selectedIndex === index
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {file.type === "directory" ? (
              <Folder className="h-4 w-4 text-blue-400 shrink-0" />
            ) : (
              <File className="h-4 w-4 text-zinc-500 shrink-0" />
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm truncate">{file.name}</span>
              <span className="text-xs text-zinc-500 truncate">{file.path}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-white/10 text-xs text-zinc-500">
        <span className="text-zinc-400">↑↓</span> navigate · <span className="text-zinc-400">enter</span> select · <span className="text-zinc-400">esc</span> close
      </div>
    </div>
  )
}
