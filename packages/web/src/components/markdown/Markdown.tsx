import { useEffect, useState, useMemo } from "react"
import { Marked } from "marked"
import markedShiki from "marked-shiki"
import { bundledLanguages, type BundledLanguage } from "shiki"
import { getSharedHighlighter } from "@pierre/precision-diffs"
import {registerOpenbrowserTheme} from "@/components/theme.ts";

registerOpenbrowserTheme();

interface MarkdownProps {
  content: string
  className?: string
}

const highlighterPromise = getSharedHighlighter({ themes: ["OpenBrowser"], langs: [] })

/**
 * Markdown component that renders markdown content with syntax highlighting
 * Uses marked for parsing and shiki for code block highlighting
 */
export function Markdown({ content, className = "" }: MarkdownProps) {
  const [html, setHtml] = useState<string>("")

  // Create marked instance with shiki extension
  const marked = useMemo(() => {
    const markedInstance = new Marked()

    // Use shiki extension for syntax highlighting
    markedInstance.use(markedShiki({
        async highlight(code, lang) {
            if (!(lang in bundledLanguages)) {
                lang = "text"
            }
            const highlighter = await highlighterPromise;
            if (!highlighter.getLoadedLanguages().includes(lang)) {
                await highlighter.loadLanguage(lang as BundledLanguage)
            }
            return highlighter.codeToHtml(code, {
                lang: lang || "text",
                theme: "OpenCode",
                tabindex: false,
            })
        },
    }))

    return markedInstance
  }, [])

  useEffect(() => {
    async function parseMarkdown() {
      try {
        const result = await marked.parse(content)
        setHtml(result as string)
      } catch (error) {
        console.error("Error parsing markdown:", error)
        setHtml(content)
      }
    }

    parseMarkdown()
  }, [content, marked])

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
