"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
  accept?: string
  onFile: (file: File) => void
  preview?: string | null
  onClear?: () => void
  label?: string
  hint?: string
  className?: string
}

export function FileDropzone({
  accept = "image/*",
  onFile,
  preview,
  onClear,
  label = "Drop your image here",
  hint = "or click to browse",
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  if (preview) {
    return (
      <div className={cn("relative group rounded-xl border-2 border-border bg-muted/30 overflow-hidden", className)}>
        <img
          src={preview}
          alt="Preview"
          className="w-full max-h-72 object-contain mx-auto"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/90 text-black px-4 py-2 text-sm font-medium hover:bg-white transition-colors shadow-lg"
            >
              Replace
            </button>
            {onClear && (
              <button
                onClick={onClear}
                className="rounded-lg bg-red-500/90 text-white p-2 hover:bg-red-500 transition-colors shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
        <div className={cn(
          "rounded-xl p-3 transition-colors",
          dragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {dragging ? (
            <Upload className="h-8 w-8" />
          ) : (
            <ImageIcon className="h-8 w-8" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{dragging ? "Release to upload" : label}</p>
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-px w-8 bg-border" />
          <span>Supports PNG, JPG, WebP, GIF</span>
          <span className="h-px w-8 bg-border" />
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
