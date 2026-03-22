import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { useNotes, useCreateNote, useUpdateNotePosition } from '../api/useNotes'
import { StickyNote } from '../components/StickyNote/StickyNote'
import type { StickyNoteColor } from '../types'
import './NotesPage.css'

const DEFAULT_COLORS: StickyNoteColor[] = ['yellow', 'green', 'pink', 'blue', 'purple', 'orange']
let colorIndex = 0

export function NotesPage() {
  const navigate = useNavigate()
  const { data: notes = [], isLoading } = useNotes()
  const createNote     = useCreateNote()
  const updatePosition = useUpdateNotePosition()

  // Client-side ordered IDs (positionX used as sort index on the server)
  const [orderedIds, setOrderedIds] = useState<string[]>([])

  const noteIdKey = [...notes].map(n => n.id).sort().join(',')
  useEffect(() => {
    if (notes.length === 0) { setOrderedIds([]); return }
    const sorted = [...notes].sort((a, b) => a.positionX - b.positionX)
    setOrderedIds(prev => {
      const existing = prev.filter(id => notes.some(n => n.id === id))
      const added    = sorted.map(n => n.id).filter(id => !prev.includes(id))
      return [...existing, ...added]
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteIdKey])

  const orderedNotes = orderedIds
    .map(id => notes.find(n => n.id === id))
    .filter(Boolean) as typeof notes

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleAddNote = () => {
    const color = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length]
    colorIndex++
    createNote.mutate({ title: '', content: '', color, positionX: notes.length, positionY: 0 })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setOrderedIds(ids => {
      const oldIndex = ids.indexOf(active.id as string)
      const newIndex = ids.indexOf(over.id as string)
      const newIds = arrayMove(ids, oldIndex, newIndex)
      updatePosition.mutate({
        id: active.id as string,
        data: { positionX: newIndex, positionY: 0, width: 270, height: 220, zIndex: 0 },
      })
      return newIds
    })
  }

  return (
    <div className="notes-page">
      <div className="notes-page-header">
        <div className="notes-page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}>📌 Notas Globais</h1>
          <p className="notes-page-subtitle">
            Arraste ⠿ para reordenar · ▲ para minimizar · ⧉ para janela flutuante · <code>/</code> para formatar · <code>/ia</code> para IA
          </p>
        </div>
        <div className="notes-page-actions">
          <button
            type="button"
            className="btn btn-secondary notes-project-btn"
            onClick={() => navigate('/notes/projects')}
          >
            Notas por Projeto
          </button>
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

      <div className="notes-body">
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
            <button type="button" className="btn btn-primary" style={{ pointerEvents: 'all' }} onClick={handleAddNote}>
              + Nova nota
            </button>
          </div>
        )}

        {!isLoading && orderedNotes.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
              <div className="notes-grid">
                {orderedNotes.map(note => (
                  <StickyNote key={note.id} note={note} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
