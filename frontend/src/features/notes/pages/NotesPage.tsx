import { useState, useRef, useCallback } from 'react'
import { useNotes, useCreateNote, useUpdateNotePosition } from '../api/useNotes'
import { StickyNote } from '../components/StickyNote/StickyNote'
import type { StickyNoteColor } from '../types'
import './NotesPage.css'

const DEFAULT_COLORS: StickyNoteColor[] = ['yellow', 'green', 'pink', 'blue', 'purple', 'orange']
let colorIndex = 0

export function NotesPage() {
  const { data: notes = [], isLoading } = useNotes()
  const createNote = useCreateNote()
  const updatePosition = useUpdateNotePosition()

  const [detachedIds, setDetachedIds] = useState<Set<string>>(new Set())
  const [zCounterMap, setZCounterMap] = useState<Map<string, number>>(new Map())
  const zCounter = useRef(notes.length + 1)

  const canvasRef = useRef<HTMLDivElement>(null)

  const handleAddNote = useCallback(() => {
    const color = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length]
    colorIndex++

    // Stagger position so notes don't stack
    const canvas = canvasRef.current
    const scrollX = canvas?.scrollLeft ?? 0
    const scrollY = canvas?.scrollTop ?? 0
    const offsetStep = (notes.length % 8) * 24
    const x = 40 + offsetStep + scrollX
    const y = 40 + offsetStep + scrollY

    createNote.mutate({ title: '', content: '', color, positionX: x, positionY: y })
  }, [notes.length, createNote])

  const handleBringToFront = useCallback((id: string) => {
    zCounter.current++
    const z = zCounter.current
    setZCounterMap(prev => new Map(prev).set(id, z))
    // Persist to server
    const note = notes.find(n => n.id === id)
    if (note) {
      updatePosition.mutate({
        id,
        data: { positionX: note.positionX, positionY: note.positionY, width: note.width, height: note.height, zIndex: z },
      })
    }
  }, [notes, updatePosition])

  const handleDetach = useCallback((id: string) => {
    setDetachedIds(prev => { const s = new Set(prev); s.add(id); return s })
  }, [])

  const handleAttach = useCallback((id: string) => {
    setDetachedIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }, [])

  const attachedNotes = notes.filter(n => !detachedIds.has(n.id))
  const detachedNotes = notes.filter(n => detachedIds.has(n.id))

  return (
    <div className="notes-page">
      {/* Page header */}
      <div className="notes-page-header">
        <div className="notes-page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}>📌 Notas</h1>
          <p className="notes-page-subtitle">
            Sticky notes livres — arraste, redimensione, destaque com IA
          </p>
        </div>
        <div className="notes-page-actions">
          {detachedNotes.length > 0 && (
            <span className="notes-floating-badge">
              {detachedNotes.length} nota{detachedNotes.length > 1 ? 's' : ''} flutuante{detachedNotes.length > 1 ? 's' : ''}
            </span>
          )}
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

      {/* Canvas */}
      <div className="notes-canvas-wrap">
        {isLoading && (
          <div className="notes-loading">
            <span>Carregando notas...</span>
          </div>
        )}

        {!isLoading && notes.length === 0 && (
          <div className="notes-empty">
            <div className="notes-empty-icon">📌</div>
            <p className="notes-empty-title">Nenhuma nota ainda</p>
            <p className="notes-empty-desc">
              Clique em <strong>+ Nova nota</strong> para criar sua primeira sticky note.
              <br />
              Use <code>/</code> para formatar e <code>/ia</code> para pedir ajuda à IA.
            </p>
            <button type="button" className="btn btn-primary" onClick={handleAddNote}>
              + Nova nota
            </button>
          </div>
        )}

        <div ref={canvasRef} className="notes-canvas">
          {attachedNotes.map(note => (
            <StickyNote
              key={note.id}
              note={{
                ...note,
                zIndex: zCounterMap.get(note.id) ?? note.zIndex,
              }}
              onBringToFront={handleBringToFront}
              onDetach={handleDetach}
              onAttach={handleAttach}
            />
          ))}
        </div>
      </div>

      {/* Detached (floating) notes — rendered outside canvas, fixed to viewport */}
      {detachedNotes.map(note => (
        <StickyNote
          key={`detached-${note.id}`}
          note={{
            ...note,
            zIndex: zCounterMap.get(note.id) ?? note.zIndex,
          }}
          onBringToFront={handleBringToFront}
          isDetached
          onDetach={handleDetach}
          onAttach={handleAttach}
        />
      ))}
    </div>
  )
}
