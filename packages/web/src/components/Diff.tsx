import { useEffect, useRef } from "react"
import { FileDiff } from "@pierre/precision-diffs"
import type { FileContents, FileDiffOptions, DiffLineAnnotation, HunkData } from "@pierre/precision-diffs"
import { registerOpenCodeTheme } from "@/components/theme"

// Register theme on module load
registerOpenCodeTheme()

export interface DiffProps<T = object> extends Omit<FileDiffOptions<T>, 'theme'> {
  before: FileContents
  after: FileContents
  annotations?: DiffLineAnnotation<T>[]
  className?: string
}

export function Diff<T = object>({ before, after, annotations, className, ...options }: DiffProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const instance = new FileDiff<T>({
      theme: "OpenCode",
      themeType: "dark",
      disableLineNumbers: false,
      overflow: "wrap",
      diffStyle: "unified",
      diffIndicators: "bars",
      disableBackground: false,
      hunkSeparators(hunkData: HunkData) {
        const fragment = document.createDocumentFragment()
        const numCol = document.createElement("div")
        numCol.innerHTML = `<svg data-slot="diff-hunk-separator-line-number-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.97978 14.0204L8.62623 13.6668L9.33334 12.9597L9.68689 13.3133L9.33333 13.6668L8.97978 14.0204ZM12 16.3335L12.3535 16.6871L12 17.0406L11.6464 16.687L12 16.3335ZM14.3131 13.3133L14.6667 12.9597L15.3738 13.6668L15.0202 14.0204L14.6667 13.6668L14.3131 13.3133ZM12.5 16.0002V16.5002H11.5V16.0002H12H12.5ZM9.33333 13.6668L9.68689 13.3133L12.3535 15.9799L12 16.3335L11.6464 16.687L8.97978 14.0204L9.33333 13.6668ZM12 16.3335L11.6464 15.9799L14.3131 13.3133L14.6667 13.6668L15.0202 14.0204L12.3535 16.6871L12 16.3335ZM6.5 8.00016V7.50016H8.5V8.00016V8.50016H6.5V8.00016ZM9.5 8.00016V7.50016H11.5V8.00016V8.50016H9.5V8.00016ZM12.5 8.00016V7.50016H14.5V8.00016V8.50016H12.5V8.00016ZM15.5 8.00016V7.50016H17.5V8.00016V8.50016H15.5V8.00016ZM12 10.5002H12.5V16.0002H12H11.5V10.5002H12Z" fill="currentColor"/></svg>`
        numCol.dataset["slot"] = "diff-hunk-separator-line-number"
        fragment.appendChild(numCol)
        const contentCol = document.createElement("div")
        contentCol.dataset["slot"] = "diff-hunk-separator-content"
        const span = document.createElement("span")
        span.dataset["slot"] = "diff-hunk-separator-content-span"
        span.textContent = `${hunkData.lines} unmodified lines`
        contentCol.appendChild(span)
        fragment.appendChild(contentCol)
        return fragment
      },
      lineDiffType: "word-alt",
      maxLineDiffLength: 1000,
      maxLineLengthForHighlighting: 1000,
      disableFileHeader: true,
      ...options,
    })

    containerRef.current.innerHTML = ""
    instance.render({
      oldFile: before,
      newFile: after,
      lineAnnotations: annotations,
      containerWrapper: containerRef.current,
    })
  }, [before, after, annotations, options])

  return (
    <div
      data-component="diff"
      className={className}
      style={{
        "--pjs-font-family": "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
        "--pjs-font-size": "13px",
        "--pjs-line-height": "24px",
        "--pjs-tab-size": "2",
        "--pjs-gap-block": "0",
        "--pjs-min-number-column-width": "4ch",
      } as React.CSSProperties}
      ref={containerRef}
    />
  )
}
