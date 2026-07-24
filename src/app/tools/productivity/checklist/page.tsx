"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { Plus, Trash2 } from "lucide-react"

interface CheckItem {
  id: string
  text: string
  done: boolean
}

export default function ChecklistPage() {
  const [title, setTitle] = useState("My Checklist")
  const [items, setItems] = useState<CheckItem[]>([])
  const [newItem, setNewItem] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("checklist-data")
    if (saved) { try { const d = JSON.parse(saved); setTitle(d.title || ""); setItems(d.items || []) } catch {} }
  }, [])

  const save = useCallback((t: string, list: CheckItem[]) => {
    setTitle(t); setItems(list)
    localStorage.setItem("checklist-data", JSON.stringify({ title: t, items: list }))
  }, [])

  const add = () => {
    if (!newItem.trim()) return
    const list = [...items, { id: Date.now().toString(), text: newItem.trim(), done: false }]
    save(title, list)
    setNewItem("")
  }

  const toggle = (id: string) => save(title, items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  const remove = (id: string) => save(title, items.filter((i) => i.id !== id))

  const exportText = items.map((i) => `${i.done ? "[x]" : "[ ]"} ${i.text}`).join("\n")
  const done = items.filter((i) => i.done).length

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Checklist Generator</h1>
      <p className="text-muted-foreground text-sm">Create and manage checklists with local persistence.</p>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <Input value={title} onChange={(e) => save(e.target.value, items)} className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0" />
          {items.length > 0 && <CopyButton text={exportText} />}
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length > 0 && (
            <div className="text-xs text-muted-foreground mb-2">{done}/{items.length} completed</div>
          )}

          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 group">
              <input type="checkbox" checked={item.done} onChange={() => toggle(item.id)} className="h-4 w-4 rounded" />
              <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
              <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 mt-3">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add() }}
              placeholder="Add an item..."
              className="text-sm"
            />
            <Button onClick={add} size="icon" variant="ghost"><Plus className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
