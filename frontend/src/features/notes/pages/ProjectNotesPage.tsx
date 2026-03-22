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
import { useWorkspaces } from '@/features/workspaces'
import { useBoards } from '@/features/boards/api'
import { useNotes, useCreateNote, useUpdateNotePosition } from '../api/useNotes'
import { StickyNote } from '../components/StickyNote/StickyNote'
import type { StickyNoteColor } from '../types'
import './NotesPage.css'
import './ProjectNotesPage.css'

const DEFAULT_COLORS: StickyNoteColor[] = ['yellow', 'green', 'pink', 'blue', 'purple', 'orange']
let colorIndex = 0

export function ProjectNotesPage() {
  const navigate = useNavigate()

  // Workspace & board selection
  const { data: workspacesData, isLoading: loadingWorkspaces } = useWorkspaces()
  const workspaces = workspacesData?.content ?? []

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)

  const { data: boardsData, isLoading: loadingBoards } = useBoards(selectedWorkspaceId)
  const boards = boardsData?.content ?? []

  // Auto-select first workspace
  useEffect(() => {
    if (!loadingWorkspaces && workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id)
    }
  }, [loadingWorkspaces, workspaces, selectedWorkspaceId])

  // Reset board when workspace changes
  useEffect(() => {
    setSelectedBoardId(null)
  }, [selectedWorkspaceId])

  // Notes for selected board
  const { data: notes = [], isLoading: loadingNotes } = useNotes(selectedBoardId ?? undefined)
  const createNote = useCreateNote(selectedBoardId ?? undefined)
  const updatePosition = useUpdateNotePosition(selectedBoardId ?? undefined)

  // Ordered IDs for drag-and-drop
  const [orderedIds, setOrderedIds] = useState<string[]>([])

  const noteIdKey = [...notes].map(n => n.id).sort().join(',')
  useEffect(() => {
    if (notes.length === 0) { setOrderedIds([]); return }
    const sorted = [...notes].sort((a, b) => a.positionX - b.positionX)
    setOrderedIds(prev => {
      const existing = prev.filter(id => notes.some(n => n.id === id))
      const added = sorted.map(n => n.id).filter(id => !prev.includes(id))
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
    if (!selectedBoardId) return
    const color = DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length]
    colorIndex++
    createNote.mutate({
      title: '',
      content: '',
      color,
      positionX: notes.length,
      positionY: 0,
      boardId: selectedBoardId,
    })
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

  const selectedBoard = boards.find(b => b.id === selectedBoardId)

  return (
    <div className="notes-page">
      <div className="notes-page-header">
        <div className="notes-page-title-row">
          <h1 className="page-title" style={{ margin: 0 }}>
            {selectedBoard ? `📋 Notas — ${selectedBoard.nome}` : '📋 Notas por Projeto'}
          </h1>
          <p className="notes-page-subtitle">
            Selecione um projeto para ver suas notas
          </p>
        </div>
        <div className="notes-page-actions">
          <button
            type="button"
            className="btn btn-secondary notes-project-btn"
            onClick={() => navigate('/notes')}
          >
            Notas Globais
          </button>
          {selectedBoardId && (
            <button
              type="button"
              className="btn btn-primary notes-add-btn"
              onClick={handleAddNote}
              disabled={createNote.isPending}
            >
              + Nova nota
            </button>
          )}
        </div>
      </div>

      {/* Project selector */}
      <div className="project-notes-selector">
        <div className="project-notes-selector-group">
          <label className="project-notes-label">Workspace</label>
          <select
            className="project-notes-select"
            value={selectedWorkspaceId ?? ''}
            onChange={e => setSelectedWorkspaceId(e.target.value || null)}
            disabled={loadingWorkspaces}
          >
            {workspaces.length === 0 && <option value="">Nenhum workspace</option>}
            {workspaces.map(w => (
              <option key={w.id} value={w.id}>{w.nome}</option>
            ))}
          </select>
        </div>

        <div className="project-notes-selector-group">
          <label className="project-notes-label">Projeto (Board)</label>
          <select
            className="project-notes-select"
            value={selectedBoardId ?? ''}
            onChange={e => setSelectedBoardId(e.target.value || null)}
            disabled={!selectedWorkspaceId || loadingBoards}
          >
            <option value="">Selecione um projeto...</option>
            {boards.map(b => (
              <option key={b.id} value={b.id}>{b.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="notes-body">
        {!selectedBoardId && (
          <div className="notes-empty">
            <div className="notes-empty-icon">📋</div>
            <p className="notes-empty-title">Selecione um projeto</p>
            <p className="notes-empty-desc">
              Escolha um workspace e um projeto acima para ver e criar notas vinculadas a ele.
            </p>
          </div>
        )}

        {selectedBoardId && loadingNotes && (
          <div className="notes-loading"><span>Carregando notas...</span></div>
        )}

        {selectedBoardId && !loadingNotes && notes.length === 0 && (
          <div className="notes-empty">
            <div className="notes-empty-icon">📌</div>
            <p className="notes-empty-title">Nenhuma nota neste projeto</p>
            <p className="notes-empty-desc">
              Clique em <strong>+ Nova nota</strong> para criar a primeira nota deste projeto.
            </p>
            <button type="button" className="btn btn-primary" style={{ pointerEvents: 'all' }} onClick={handleAddNote}>
              + Nova nota
            </button>
          </div>
        )}

        {selectedBoardId && !loadingNotes && orderedNotes.length > 0 && (
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
