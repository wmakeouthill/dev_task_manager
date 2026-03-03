import { useRef, useCallback, useState } from 'react'
import { useNotes, useCreateNote, useUpdateNotePosition } from '../api/useNotes'
import { StickyNote } from '../components/StickyNote/StickyNote'
import type { StickyNoteColor } from '../types'
import './NotesPage.css'

const DEFAULT_COLORS: StickyNoteColor[] = ['yellow', 'green', 'pink', 'blue', 'purple', 'orange']
let colorIndex = 0

export function NotesPage() {
  const { data: notes = [], isLoading } = useNotes()
  const createNote     = useCreateNote()
  const updatePosition = useUpdateNotePosition()

  const [zCounterMap, setZCounterMap] = useState<Map<string, number>>(new Map())
  const zCounter  = useRef(1)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleAddNote = useCallback(() => {
    const color = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length]
    colorIndex++
    const canvas     = canvasRef.current
    const scrollX    = canvas?.scrollLeft ?? 0
    const scrollY    = canvas?.scrollTop  ?? 0
    const offsetStep = (notes.length % 8) * 24
    createNote.mutate({ title: '', content: '', color, positionX: 40 + offsetStep + scrollX, positionY: 40 + offsetStep + scrollY })
  }, [notes.length, createNote])

  const handleBringToFront = useCallback((id: string) => {
    zCounter.current++
    const z = zCounter.current
    setZCounterMap(prev => new Map(prev).set(id, z))
    const note = notes.find(n => n.id === id)
    if (note) {
      updatePosition.mutate({ id, data: { positionX: note.positionX, positionY: note.positionY, width: note.width, height: note.height, zIndex: z } })
    }
  }, [notes, updatePosition])

  return (
    <div className="notes-page">
      <div className="notes-page-header">
        <div className="notes-page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}>📌 Notas</h1>
          <p className="notes-page-subtitle">
            Sticky notes livres — arraste, redimensione, destaque com IA. Use ⧉ para abrir como janela flutuante.
          </p>
        </div>
        <div className="notes-page-actions">
          <button
            type="button"
            className="btn btn-primary notes-add-btn"
            onClick={handleAddNote}
            disabled={createNote.isPending}
          >
            + Nova nota
          </button>
        </div>
      </div>

      <div className="notes-canvas-wrap">
        {isLoading && <div className="notes-loading"><span>Carregando notas...</span></div>}

        {!isLoading && notes.length === 0 && (
          <div className="notes-empty">
            <div className="notes-empty-icon">📌</div>
            <p className="notes-empty-title">Nenhuma nota ainda</p>
            <p className="notes-empty-desc">
              Clique em <strong>+ Nova nota</strong> para criar sua primeira sticky note.
              <br />
              Use <code>/</code> para formatar e <code>/ia</code> para pedir ajuda à IA.
              <br />
              Use <code>⧉</code> para abrir a nota como uma janela flutuante independente.
            </p>
            <button type="button" className="btn btn-primary" onClick={handleAddNote}>+ Nova nota</button>
          </div>
        )}

        <div ref={canvasRef} className="notes-canvas">
          {notes.map(note => (
            <StickyNote
              key={note.id}
              note={{ ...note, zIndex: zCounterMap.get(note.id) ?? note.zIndex }}
              onBringToFront={handleBringToFront}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
