"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"

interface Note {
  id: string
  text: string
  color: string
  createdAt: number
}

const COLORS = ["bg-yellow-200 dark:bg-yellow-900/40", "bg-blue-200 dark:bg-blue-900/40", "bg-green-200 dark:bg-green-900/40", "bg-pink-200 dark:bg-pink-900/40", "bg-purple-200 dark:bg-purple-900/40"]

export default function StickyNotesPage() {
  const [notes, setNotes] = useState<Note[]>([])

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sticky-notes")
    if (saved) {
      try { setNotes(JSON.parse(saved)) } catch {}
    }
  }, [])

  // Autosave
  const save = useCallback((n: Note[]) => {
    setNotes(n)
    localStorage.setItem("sticky-notes", JSON.stringify(n))
  }, [])

  const addNote = () => {
    const note: Note = {
      id: Date.now().toString(),
      text: "",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: Date.now(),
    }
    save([note, ...notes])
  }

  const updateNote = (id: string, text: string) => {
    save(notes.map((n) => (n.id === id ? { ...n, text } : n)))
  }

  const deleteNote = (id: string) => {
    save(notes.filter((n) => n.id !== id))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sticky Notes</h1>
          <p className="text-muted-foreground text-sm">Quick notes that autosave locally.</p>
        </div>
        <Button onClick={addNote} size="sm"><Plus className="h-4 w-4 mr-1" />Add Note</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card key={note.id} className={`${note.color} border-0`}>
            <CardContent className="pt-4 relative">
              <button onClick={() => deleteNote(note.id)} className="absolute top-2 right-2 p-1 rounded hover:bg-black/10">
                <X className="h-3 w-3" />
              </button>
              <textarea
                className="w-full min-h-[120px] bg-transparent text-sm resize-none outline-none placeholder:text-foreground/40"
                placeholder="Type your note..."
                value={note.text}
                onChange={(e) => updateNote(note.id, e.target.value)}
              />
              <p className="text-[10px] text-foreground/40 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No notes yet. Click &quot;Add Note&quot; to get started.</p>
        </div>
      )}
    </div>
  )
}
