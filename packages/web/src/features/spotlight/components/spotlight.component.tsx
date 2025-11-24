import { useEffect, useRef, useMemo } from "react"
import { Command } from "cmdk"
import {
  Plus,
  FileText,
  Github,
  MessageSquare,
  Trash2,
  HelpCircle,
  File,
  Search,
  Settings,
  Cpu,
  Sparkles
} from "lucide-react"
import {
  useSpotlightOpen,
  useSpotlightSearch,
  useSpotlightCurrentPage,
  useOpenSpotlight,
  useCloseSpotlight,
  useToggleSpotlight,
  useSetSpotlightSearch,
  usePushSpotlightPage,
  usePopSpotlightPage,
} from "@/features/spotlight/spotlight.context"
import { useFileClick } from "@/features/filesystem/hooks/useFileClick"
import { useFileList } from "@/features/filesystem/hooks/useFileList"
import {
  useSessions,
  useVisibleSessionIds,
  useAddUISession,
  useSetActiveSession,
  useClearAllSessions,
} from "@/features/session"
import {
  useSelectedAgent,
  useSetSelectedAgent,
  useSelectedModel,
  useSetSelectedModel,
} from "@/features/chat/chat.context"
import { useInstanceContext } from "@/features/instance"
import { useSandboxConfig } from "@/features/sandbox-creator"
import { useSandboxContext } from "@/features/sandbox"
import type { UISession } from "@/features/session/session.store"
import type { FileNode, FileItem } from "@/features/filesystem"
import type { Model } from "@/features/chat/chat.store"
import opencodeLogoUrl from "@/assets/icons/opencode-logo.svg"
import claudeCodeLogoUrl from "@/assets/icons/claude-code-logo.svg"

// SDK Configuration
const SDK_CONFIG: Record<string, { name: string; iconUrl: string }> = {
  OPENCODE: { name: "OpenCode", iconUrl: opencodeLogoUrl },
  CLAUDE_CODE: { name: "Claude Code", iconUrl: claudeCodeLogoUrl },
  opencode: { name: "OpenCode", iconUrl: opencodeLogoUrl },
  "claude-code": { name: "Claude Code", iconUrl: claudeCodeLogoUrl },
}

const normalizeSdkId = (id: string): string => {
  return id.toLowerCase().replace(/_/g, "-")
}

interface SdkOption {
  id: string
  name: string
  iconUrl: string
}

interface ModelInfo {
  id: string
  name: string
  providerId: string
  providerName: string
}

// Maximum number of files to show when no search query
const MAX_FILES_INITIAL = 50
// Maximum number of files to show when searching
const MAX_FILES_FILTERED = 100

export function SpotlightComponent() {
  const inputRef = useRef<HTMLInputElement>(null)

  // State
  const isOpen = useSpotlightOpen()
  const search = useSpotlightSearch()
  const currentPage = useSpotlightCurrentPage()

  // Actions
  const closeSpotlight = useCloseSpotlight()
  const toggleSpotlight = useToggleSpotlight()
  const setSearch = useSetSpotlightSearch()
  const pushPage = usePushSpotlightPage()
  const popPage = usePopSpotlightPage()

  // Integration with other features
  const availableFiles = useFileList()
  const addSession = useAddUISession()
  const setActiveSession = useSetActiveSession()
  const sessions = useSessions()
  const visibleSessionIds = useVisibleSessionIds()
  const clearAllSessions = useClearAllSessions()
  const { handleFileClick } = useFileClick()

  // SDK, Agent, Model state
  const config = useSandboxConfig()
  const currentProvider = useSandboxContext((state) => state.sandbox?.provider)
  const selectedAgent = useSelectedAgent()
  const setSelectedAgent = useSetSelectedAgent()
  const selectedModel = useSelectedModel()
  const setSelectedModel = useSetSelectedModel()
  const agents = useInstanceContext((s) => s.agent)
  const providers = useInstanceContext((s) => s.providers)
  const sdkConfig = useInstanceContext((s) => s.sdkConfig)

  // Get available SDKs
  const availableSdks = useMemo((): SdkOption[] => {
    if (!config || !currentProvider) {
      return [
        { id: "opencode", name: "OpenCode", iconUrl: opencodeLogoUrl },
        { id: "claude-code", name: "Claude Code", iconUrl: claudeCodeLogoUrl },
      ]
    }

    const providerConfig = config.providers.find(
      (p) => p.name === currentProvider
    )

    if (!providerConfig) {
      return [
        { id: "opencode", name: "OpenCode", iconUrl: opencodeLogoUrl },
        { id: "claude-code", name: "Claude Code", iconUrl: claudeCodeLogoUrl },
      ]
    }

    return providerConfig.sdks.map((sdk) => {
      const sdkConfig = SDK_CONFIG[sdk] || SDK_CONFIG[normalizeSdkId(sdk)]
      return {
        id: normalizeSdkId(sdk),
        name: sdkConfig?.name || sdk,
        iconUrl: sdkConfig?.iconUrl || opencodeLogoUrl,
      }
    })
  }, [config, currentProvider])

  // Get available agents
  const availableAgents = useMemo(() => {
    if (!agents || !Array.isArray(agents)) return []

    return agents.filter(
      (agent) => agent.mode === "primary" || agent.mode === "all"
    )
  }, [agents])

  // Get available models
  const availableModels = useMemo((): ModelInfo[] => {
    if (!providers?.providers) return []

    const modelList: ModelInfo[] = []

    for (const provider of providers.providers) {
      if (provider.models) {
        for (const [modelId, modelData] of Object.entries(provider.models)) {
          modelList.push({
            id: modelId,
            name: (modelData as any)?.name || modelId,
            providerId: provider.id,
            providerName: provider.name,
          })
        }
      }
    }

    return modelList
  }, [providers])

  // Limit files for performance - let cmdk handle filtering
  const limitedFiles = useMemo(() => {
    if (!availableFiles.length) return []
    
    const searchLower = search.toLowerCase().trim()
    
    // If no search query, return limited initial set
    if (!searchLower) {
      return availableFiles.slice(0, MAX_FILES_INITIAL)
    }
    
    // When searching, pre-filter to reduce items cmdk needs to process
    // This improves performance while still letting cmdk handle the final filtering
    const filtered = availableFiles.filter((file) => {
      const nameLower = file.name.toLowerCase()
      const pathLower = file.path.toLowerCase()
      return nameLower.includes(searchLower) || pathLower.includes(searchLower)
    })
    
    // Limit filtered results
    return filtered.slice(0, MAX_FILES_FILTERED)
  }, [availableFiles, search])

  // Reset search and focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearch("")
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [isOpen, setSearch])

  // Handle keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSpotlight()
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault()
        closeSpotlight()
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [isOpen, toggleSpotlight, closeSpotlight])

  const runCommand = (command: () => void) => {
    closeSpotlight()
    command()
  }

  const handleNewSession = () => {
    const newSession: UISession = {
      id: Date.now().toString(),
      title: "new session",
      ephemeral: true,
    }
    addSession(newSession)
  }

  const handleFileSelect = (file: FileItem) => {
    const fileNode: FileNode = {
      name: file.name,
      path: file.path,
      type: "file"
    }
    handleFileClick(fileNode)
  }

  const handleSessionSelect = (session: UISession) => {
    // Check if session is already visible in the top bar
    const isVisible = visibleSessionIds.includes(session.id)

    // If not visible, add it to visible sessions
    if (!isVisible) {
      addSession(session)
    }

    setActiveSession(session.id)
  }

  const handleAgentSelect = (agentName: string) => {
    setSelectedAgent(agentName)
  }

  const handleModelSelect = (modelInfo: ModelInfo) => {
    const model: Model = {
      modelID: modelInfo.id,
      providerID: modelInfo.providerId,
    }
    setSelectedModel(model)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeSpotlight}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <Command
          className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          loop
          onKeyDown={(e) => {
            // Escape goes to previous page
            // Backspace goes to previous page when search is empty
            if (e.key === 'Escape' || (e.key === 'Backspace' && !search)) {
              e.preventDefault()
              if (currentPage) {
                popPage()
              } else {
                closeSpotlight()
              }
            }
          }}
        >
          <Command.Input
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="type a command or search..."
            className="w-full px-4 py-4 bg-transparent border-b border-white/10 text-white placeholder:text-zinc-500 focus:outline-none text-sm"
            autoFocus
          />
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-zinc-500">
              no results found.
            </Command.Empty>

            {!currentPage && (
              <>
                <Command.Group heading="actions" className="px-2 py-1.5 text-xs text-zinc-500">
                  <Command.Item
                    value="new session"
                    onSelect={() => runCommand(handleNewSession)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>new session</span>
                    <span className="ml-auto text-xs text-zinc-500">⌘N</span>
                  </Command.Item>
                  <Command.Item
                    value="search sessions"
                    onSelect={() => pushPage('sessions')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Search className="h-4 w-4" />
                    <span>search sessions…</span>
                  </Command.Item>
                  <Command.Item
                    value="add context"
                    onSelect={() => pushPage('files')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    <span>add context</span>
                  </Command.Item>
                  <Command.Item
                    value="close all sessions"
                    onSelect={() => runCommand(clearAllSessions)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>close all sessions</span>
                  </Command.Item>
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-white/10" />

                <Command.Group heading="settings" className="px-2 py-1.5 text-xs text-zinc-500">
                  {availableSdks.length > 0 && (
                    <Command.Item
                      value="switch sdk"
                      onSelect={() => pushPage('sdks')}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      <span>switch SDK…</span>
                    </Command.Item>
                  )}
                  {availableAgents.length > 0 && (
                    <Command.Item
                      value="switch agent"
                      onSelect={() => pushPage('agents')}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <Cpu className="h-4 w-4" />
                      <span>switch agent…</span>
                    </Command.Item>
                  )}
                  {availableModels.length > 0 && (
                    <Command.Item
                      value="switch model"
                      onSelect={() => pushPage('models')}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>switch model…</span>
                    </Command.Item>
                  )}
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-white/10" />

                <Command.Group heading="integrations" className="px-2 py-1.5 text-xs text-zinc-500">
                  <Command.Item
                    value="open github"
                    onSelect={() => runCommand(() => window.open("https://github.com", "_blank"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <Github className="h-4 w-4" />
                    <span>open github</span>
                  </Command.Item>
                  <Command.Item
                    value="open arxiv"
                    onSelect={() => runCommand(() => window.open("https://arxiv.org", "_blank"))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <FileText className="h-4 w-4" />
                    <span>open arxiv</span>
                  </Command.Item>
                </Command.Group>

                <Command.Separator className="my-2 h-px bg-white/10" />

                {limitedFiles.length > 0 && (
                  <>
                    <Command.Group 
                      heading={`files${availableFiles.length > limitedFiles.length ? ` (showing ${limitedFiles.length} of ${availableFiles.length})` : ''}`} 
                      className="px-2 py-1.5 text-xs text-zinc-500"
                    >
                      {limitedFiles.map((file) => (
                        <Command.Item
                          key={file.path}
                          value={`${file.name} ${file.path}`}
                          onSelect={() => runCommand(() => handleFileSelect(file))}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                        >
                          <File className="h-4 w-4" />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate">{file.name}</span>
                            <span className="text-xs text-zinc-500 truncate">{file.path}</span>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                    <Command.Separator className="my-2 h-px bg-white/10" />
                  </>
                )}

                <Command.Group heading="help" className="px-2 py-1.5 text-xs text-zinc-500">
                  <Command.Item
                    value="keyboard shortcuts"
                    onSelect={() => pushPage('help')}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>keyboard shortcuts</span>
                    <span className="ml-auto text-xs text-zinc-500">?</span>
                  </Command.Item>
                </Command.Group>
              </>
            )}

            {currentPage === 'sessions' && (
              <Command.Group heading="sessions" className="px-2 py-1.5 text-xs text-zinc-500">
                {sessions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">no sessions found</div>
                ) : (
                  sessions.map((session) => (
                    <Command.Item
                      key={session.id}
                      value={`${session.id} ${session.title} ${session.type || ''}`}
                      onSelect={() => runCommand(() => handleSessionSelect(session))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{session.title}</span>
                        {session.type && (
                          <span className="text-xs text-zinc-500">{session.type}</span>
                        )}
                      </div>
                    </Command.Item>
                  ))
                )}
              </Command.Group>
            )}

            {currentPage === 'files' && (
              <Command.Group 
                heading={`add context files${availableFiles.length > limitedFiles.length ? ` (showing ${limitedFiles.length} of ${availableFiles.length})` : ''}`}
                className="px-2 py-1.5 text-xs text-zinc-500"
              >
                {limitedFiles.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">no files found</div>
                ) : (
                  limitedFiles.map((file) => (
                    <Command.Item
                      key={file.path}
                      value={`${file.name} ${file.path}`}
                      onSelect={() => runCommand(() => handleFileSelect(file))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <File className="h-4 w-4" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-zinc-500 truncate">{file.path}</span>
                      </div>
                    </Command.Item>
                  ))
                )}
              </Command.Group>
            )}

            {currentPage === 'sdks' && (
              <Command.Group heading="switch SDK" className="px-2 py-1.5 text-xs text-zinc-500">
                {availableSdks.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">no SDKs found</div>
                ) : (
                  availableSdks.map((sdk) => (
                    <Command.Item
                      key={sdk.id}
                      value={`${sdk.name} ${sdk.id}`}
                      onSelect={() => {
                        closeSpotlight()
                        // Note: SDK switching is currently not implemented in the chat store
                        // This would need to be added similar to agent/model selection
                        console.log('SDK selected:', sdk.id)
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <img
                        src={sdk.iconUrl}
                        alt={sdk.name}
                        className="h-4 w-4"
                      />
                      <span>{sdk.name}</span>
                    </Command.Item>
                  ))
                )}
              </Command.Group>
            )}

            {currentPage === 'agents' && (
              <Command.Group heading="switch agent" className="px-2 py-1.5 text-xs text-zinc-500">
                {availableAgents.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">no agents found</div>
                ) : (
                  availableAgents.map((agent) => (
                    <Command.Item
                      key={agent.name}
                      value={`${agent.name} ${agent.description || ''}`}
                      onSelect={() => runCommand(() => handleAgentSelect(agent.name))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                      style={
                        agent.color
                          ? {
                              borderLeft: `2px solid ${agent.color}`,
                              paddingLeft: "0.625rem",
                            }
                          : undefined
                      }
                    >
                      <Cpu className="h-4 w-4" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{agent.name}</span>
                        {agent.description && (
                          <span className="text-xs text-zinc-500 truncate">
                            {agent.description}
                          </span>
                        )}
                        <div className="flex items-center gap-1 mt-0.5">
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
                      {selectedAgent === agent.name && (
                        <span className="ml-auto text-xs text-green-500">✓</span>
                      )}
                    </Command.Item>
                  ))
                )}
              </Command.Group>
            )}

            {currentPage === 'models' && (
              <Command.Group heading="switch model" className="px-2 py-1.5 text-xs text-zinc-500">
                {availableModels.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500">no models found</div>
                ) : (
                  availableModels.map((modelInfo) => (
                    <Command.Item
                      key={`${modelInfo.providerId}-${modelInfo.id}`}
                      value={`${modelInfo.name} ${modelInfo.providerName}`}
                      onSelect={() => runCommand(() => handleModelSelect(modelInfo))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                    >
                      <Sparkles className="h-4 w-4" />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{modelInfo.name}</span>
                        <span className="text-xs text-zinc-500 truncate">
                          {modelInfo.providerName}
                        </span>
                      </div>
                      {selectedModel?.modelID === modelInfo.id && selectedModel?.providerID === modelInfo.providerId && (
                        <span className="ml-auto text-xs text-green-500">✓</span>
                      )}
                    </Command.Item>
                  ))
                )}
              </Command.Group>
            )}

            {currentPage === 'help' && (
              <Command.Group heading="keyboard shortcuts" className="px-2 py-1.5 text-xs text-zinc-500">
                <div className="px-3 py-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">open command palette</span>
                    <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">⌘K</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">new session</span>
                    <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">⌘N</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">navigate items</span>
                    <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">↑↓</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">select item</span>
                    <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">↵</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">send message</span>
                    <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">↵</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">new line</span>
                    <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">⇧↵</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300">mention file</span>
                    <kbd className="px-2 py-1 bg-white/10 border border-white/20 rounded text-xs">@</kbd>
                  </div>
                </div>
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">↑↓</span> navigate
              <span className="text-zinc-400 ml-2">↵</span> select
              <span className="text-zinc-400 ml-2">esc</span> close
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}
