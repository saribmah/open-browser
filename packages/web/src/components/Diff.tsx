import { useEffect, useRef } from "react"
import { FileDiff } from "@pierre/precision-diffs"
import type { FileContents, FileDiffOptions, DiffLineAnnotation, HunkData } from "@pierre/precision-diffs"

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
