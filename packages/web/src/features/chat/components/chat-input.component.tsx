import { useState, useRef } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { FileMention } from "@/features/filesystem/components/file-mention.component.tsx"
import { SdkSelector } from "./sdk-selector.component"
import { ModelSelector } from "./model-selector.component"
import type { FormEvent, KeyboardEvent } from "react"
import type { FileItem } from "@/features/filesystem"
import { useSendMessage, useSelectedModel, useSetSelectedModel } from "@/features/chat/chat.context"
import {
  useActiveSession,
  useConvertEphemeralToReal,
} from "@/features/session"
import { useFileList } from "@/features/filesystem/hooks/useFileList"

interface ChatInputProps {
  placeholder?: string
  disabled?: boolean
  selectedSdk?: string
  onSdkChange?: (sdkId: string) => void
}

export function ChatInput({
  placeholder = "ask anything...",
  disabled = false,
  selectedSdk = "opencode",
  onSdkChange,
}: ChatInputProps) {
  // Get state and actions from stores
  const activeSession = useActiveSession()
  const sendMessage = useSendMessage()
  const convertEphemeralToReal = useConvertEphemeralToReal()
  const availableFiles = useFileList()
  const selectedModel = useSelectedModel()
  const setSelectedModel = useSetSelectedModel()

  // Local state
  const [message, setMessage] = useState("")
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
            <SdkSelector 
              selectedSdk={selectedSdk}
              onSdkChange={onSdkChange}
            />

            {/* Model selector */}
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
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
