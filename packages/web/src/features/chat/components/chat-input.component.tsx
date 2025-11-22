import { useState, useRef } from "react"
import { ArrowUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { FileMention } from "@/features/filesystem/components/file-mention.component.tsx"
import { cn } from "@/lib/utils"
import type { FormEvent, KeyboardEvent } from "react"
import type { FileItem } from "@/features/filesystem"
import { useSendMessage } from "@/features/chat/chat.context"
import {
  useActiveSession,
  useConvertEphemeralToReal,
} from "@/features/session"
import { useFileList } from "@/features/filesystem/hooks/useFileList"

const sdks = [
  { id: "opencode", name: "opencode" },
  { id: "claude-code", name: "claude code" },
]

const models = [
  { id: "claude-sonnet-4", name: "claude sonnet 4" },
  { id: "claude-opus-4", name: "claude opus 4" },
  { id: "gpt-4o", name: "gpt-4o" },
  { id: "gpt-4o-mini", name: "gpt-4o mini" },
]

interface ChatInputProps {
  placeholder?: string
  disabled?: boolean
  selectedModel?: string
  onModelChange?: (modelId: string) => void
  selectedSdk?: string
  onSdkChange?: (sdkId: string) => void
}

export function ChatInput({
  placeholder = "ask anything...",
  disabled = false,
  selectedModel = "claude-sonnet-4",
  onModelChange,
  selectedSdk = "opencode",
  onSdkChange,
}: ChatInputProps) {
  // Get state and actions from stores
  const activeSession = useActiveSession()
  const sendMessage = useSendMessage()
  const convertEphemeralToReal = useConvertEphemeralToReal()
  const availableFiles = useFileList()

  // Local state
  const [message, setMessage] = useState("")
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false)
  const [isSdkSelectorOpen, setIsSdkSelectorOpen] = useState(false)
  const [showFileMention, setShowFileMention] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionedFiles, setMentionedFiles] = useState<FileItem[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() || disabled || !activeSession) return

    // Check if the session is ephemeral and convert it to a real session
    if (activeSession.ephemeral && activeSession.type === "chat") {
      const backendSession = await convertEphemeralToReal(activeSession.id)

      if (!backendSession) {
        console.error("Failed to convert ephemeral session to real session")
        return
      }

      // The active session has been updated to the new backend session
      // Send message with the new session ID
      sendMessage(message.trim(), mentionedFiles.length > 0 ? mentionedFiles : undefined)
    } else {
      // Session already exists, send message normally
      sendMessage(message.trim(), mentionedFiles.length > 0 ? mentionedFiles : undefined)
    }

    setMessage("")
    setMentionedFiles([])
  }

  const filteredFiles = availableFiles.filter((file) =>
    file.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    file.path.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showFileMention) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex((prev) => (prev + 1) % filteredFiles.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex((prev) => (prev - 1 + filteredFiles.length) % filteredFiles.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredFiles[mentionIndex]) {
          handleFileSelect(filteredFiles[mentionIndex])
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        setShowFileMention(false)
        setMentionQuery("")
      }
      return
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (value: string) => {
    setMessage(value)

    // Check for @ trigger
    const textarea = textareaRef.current
    if (textarea) {
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = value.slice(0, cursorPos)
      const atIndex = textBeforeCursor.lastIndexOf("@")

      if (atIndex !== -1) {
        const textAfterAt = textBeforeCursor.slice(atIndex + 1)
        // Only show if @ is at start or after a space, and no space after @
        const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " "
        if ((charBeforeAt === " " || charBeforeAt === "\n" || atIndex === 0) && !textAfterAt.includes(" ")) {
          setShowFileMention(true)
          setMentionQuery(textAfterAt)
          setMentionIndex(0)
          return
        }
      }
    }
    setShowFileMention(false)
    setMentionQuery("")
  }

  const handleFileSelect = (file: FileItem) => {
    const textarea = textareaRef.current
    if (textarea) {
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = message.slice(0, cursorPos)
      const atIndex = textBeforeCursor.lastIndexOf("@")
      const textAfterCursor = message.slice(cursorPos)

      const newMessage = textBeforeCursor.slice(0, atIndex) + `@${file.name} ` + textAfterCursor
      setMessage(newMessage)
      setMentionedFiles((prev) => [...prev.filter(f => f.path !== file.path), file])
    }
    setShowFileMention(false)
    setMentionQuery("")
    textareaRef.current?.focus()
  }

  const removeMentionedFile = (filePath: string) => {
    setMentionedFiles((prev) => prev.filter(f => f.path !== filePath))
  }

  const currentModel = models.find(m => m.id === selectedModel) || models[0]
  const currentSdk = sdks.find(s => s.id === selectedSdk) || sdks[0]

  const handleModelSelect = (modelId: string) => {
    onModelChange?.(modelId)
    setIsModelSelectorOpen(false)
  }

  const handleSdkSelect = (sdkId: string) => {
    onSdkChange?.(sdkId)
    setIsSdkSelectorOpen(false)
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col bg-zinc-900 border border-white/10 rounded-2xl shadow-lg"
      >
        {/* File mention popup */}
        {showFileMention && availableFiles.length > 0 && (
          <FileMention
            files={availableFiles}
            selectedIndex={mentionIndex}
            onSelect={handleFileSelect}
            onClose={() => {
              setShowFileMention(false)
              setMentionQuery("")
            }}
            searchQuery={mentionQuery}
          />
        )}

        {/* Mentioned files tags */}
        {mentionedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-3">
            {mentionedFiles.map((file) => (
              <span
                key={file.path}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs"
              >
                @{file.name}
                <button
                  type="button"
                  onClick={() => removeMentionedFile(file.path)}
                  className="hover:text-blue-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="flex-1 resize-none bg-transparent px-4 pt-4 pb-2 pr-14 text-white placeholder:text-zinc-500 focus:outline-none text-sm max-h-48 min-h-[88px]"
          style={{ height: "88px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = "88px"
            target.style.height = `${Math.min(target.scrollHeight, 192)}px`
          }}
        />

        {/* Bottom bar with selectors */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2">
            {/* SDK selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSdkSelectorOpen(!isSdkSelectorOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                <span>{currentSdk?.name}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* SDK dropdown */}
              {isSdkSelectorOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsSdkSelectorOpen(false)}
                  />
                  <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 min-w-[120px]">
                    {sdks.map((sdk) => (
                      <button
                        key={sdk.id}
                        type="button"
                        onClick={() => handleSdkSelect(sdk.id)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs transition-colors",
                          selectedSdk === sdk.id
                            ? "bg-white/10 text-white"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {sdk.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Model selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs transition-colors"
              >
                <span>{currentModel?.name}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {/* Model dropdown */}
              {isModelSelectorOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsModelSelectorOpen(false)}
                  />
                  <div className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden z-20 min-w-[160px]">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => handleModelSelect(model.id)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-xs transition-colors",
                          selectedModel === model.id
                            ? "bg-white/10 text-white"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            className="h-8 w-8 p-0 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
      <p className="text-center text-xs text-zinc-500 mt-2">
        press enter to send, shift + enter for new line
      </p>
    </div>
  )
}
