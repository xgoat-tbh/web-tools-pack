"use client"

import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/hooks/use-copy"
import { Copy, Check } from "lucide-react"

export function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useCopyToClipboard()

  return (
    <Button variant="ghost" size="icon" onClick={() => copy(text)} title="Copy to clipboard">
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}
