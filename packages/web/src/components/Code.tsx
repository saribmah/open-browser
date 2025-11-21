import { useEffect, useRef } from "react"
import { File } from "@pierre/precision-diffs"
import type { FileContents, FileOptions, LineAnnotation } from "@pierre/precision-diffs"
import { registerOpenCodeTheme } from "@/components/theme"

// Register theme on module load
registerOpenCodeTheme()

export interface CodeProps<T = object> extends Omit<FileOptions<T>, 'theme'> {
  file: FileContents
  annotations?: LineAnnotation<T>[]
  className?: string
}

export function Code<T = object>({ file, annotations, className, ...options }: CodeProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const instance = new File<T>({
      theme: "OpenCode",
      overflow: "wrap",
      themeType: "dark",
      disableFileHeader: true,
      disableLineNumbers: false,
      ...options,
    })

    containerRef.current.innerHTML = ""
    instance.render({
      file,
      lineAnnotations: annotations,
      containerWrapper: containerRef.current,
    })
  }, [file, annotations, options])

  return (
    <div
      data-component="code"
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
