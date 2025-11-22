import { useEffect, useState, useMemo } from "react"
import { Marked } from "marked"
import markedShiki from "marked-shiki"

interface MarkdownProps {
  content: string
  className?: string
}

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
    markedInstance.use(markedShiki())
    
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
