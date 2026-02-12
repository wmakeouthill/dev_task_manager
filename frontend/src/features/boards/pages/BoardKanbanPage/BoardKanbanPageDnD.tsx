import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useBoard, useAddColumn, useUpdateColumn, useMoveColumn, useDeleteColumn } from '@/features/boards'
import { useCards, useCreateCard, useMoveCard } from '@/features/cards'
import { ColumnSettingsModal } from '@/features/boards/components/ColumnSettingsModal'
import { SortableColumn } from '@/features/boards/components/SortableColumn'
import type { ColumnDto } from '@/features/boards/types/board.types'
import type { Card } from '@/features/cards/types/card.types'
import type { UpdateColumnRequest } from '@/features/boards/api/columnApi'

function KanbanDragOverlayContent({
  activeCard,
  activeColumn,
}: Readonly<{
  activeCard: Card | null
  activeColumn: ColumnDto | null
}>) {
  if (activeCard) {
    return (
      <div className="kanban-card kanban-card-dragging">
        <span className="kanban-card-title">{activeCard.titulo}</span>
      </div>
    )
  }
  if (activeColumn) {
    return (
      <div className="kanban-column kanban-column-dragging">
        <div className="kanban-column-header">
          <span className="kanban-column-drag-handle">⋮⋮</span>
          <h2 className="kanban-column-title">{activeColumn.nome}</h2>
        </div>
      </div>
    )
  }
  return null
}

export function BoardKanbanPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const [newCardTitulo, setNewCardTitulo] = useState<Record<string, string>>({})
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [activeColumn, setActiveColumn] = useState<ColumnDto | null>(null)
  const [editingColumn, setEditingColumn] = useState<ColumnDto | null>(null)

  const { data: board, isLoading: loadingBoard } = useBoard(boardId ?? null)
  const { data: cardsData, isLoading: loadingCards } = useCards(boardId ?? null)
  const addColumn = useAddColumn(boardId ?? null)
  const updateColumn = useUpdateColumn(boardId ?? null)
  const moveColumn = useMoveColumn(boardId ?? null)
  const deleteColumn = useDeleteColumn(boardId ?? null)
  const createCard = useCreateCard(boardId ?? null)
  const moveCard = useMoveCard(boardId ?? null)

  const columns: ColumnDto[] = board?.columns ?? []
  const cards = cardsData?.content ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleAddColumn = () => {
    const nome = `Coluna ${columns.length + 1}`
    addColumn.mutate({ nome, ordem: columns.length })
  }

  const handleAddCard = (e: React.FormEvent, columnId: string) => {
    e.preventDefault()
    const titulo = newCardTitulo[columnId]?.trim()
    if (!titulo) return
    createCard.mutate(
      { columnId, titulo, ordem: cards.filter((c) => c.columnId === columnId).length },
      { onSuccess: () => setNewCardTitulo((prev) => ({ ...prev, [columnId]: '' })) }
    )
  }

  const handleColumnSave = (data: UpdateColumnRequest) => {
    if (!editingColumn) return
    updateColumn.mutate({ id: editingColumn.id, data })
  }

  const handleColumnDelete = () => {
    if (!editingColumn) return
    deleteColumn.mutate(editingColumn.id)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type
    if (type === 'column') {
      setActiveColumn((event.active.data.current?.column as ColumnDto) ?? null)
      return
    }
    const card = cards.find((c) => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    const type = active.data.current?.type

    if (type === 'column') {
      setActiveColumn(null)
      if (!over || over.id === active.id) return
      const sortedCols = columns.slice().sort((a, b) => a.ordem - b.ordem)
      const columnIds = sortedCols.map((c) => c.id)
      const overIndex = columnIds.indexOf(over.id as string)
      if (overIndex === -1) return
      moveColumn.mutate({ id: active.id as string, data: { novaOrdem: overIndex } })
      return
    }

    setActiveCard(null)
    if (!over || active.id === over.id) return

    const draggedCard = cards.find((c) => c.id === active.id)
    if (!draggedCard) return

    let targetColumnId: string
    let targetOrder: number
    const overCard = cards.find((c) => c.id === over.id)
    if (overCard) {
      targetColumnId = overCard.columnId
      targetOrder = overCard.ordem
    } else {
      targetColumnId = over.id as string
      targetOrder = cards.filter((c) => c.columnId === targetColumnId).length
    }

    if (draggedCard.columnId === targetColumnId && draggedCard.ordem === targetOrder) return

    moveCard.mutate({
      id: draggedCard.id,
      data: { columnId: targetColumnId, ordem: targetOrder },
    })
  }

  if (!boardId) {
    navigate('/boards', { replace: true })
    return null
  }

  if (loadingBoard || !board) {
    return (
      <div className="page">
        <p className="loading-text">Carregando board…</p>
      </div>
    )
  }

  const sortedColumns = columns.slice().sort((a, b) => a.ordem - b.ordem)

  return (
    <div className="page kanban-page">
      <header className="kanban-header">
        <button
          type="button"
          className="kanban-back-btn"
          onClick={() => navigate('/boards')}
          aria-label="Voltar para lista de boards"
        >
          <span className="kanban-back-icon" aria-hidden>←</span>
          Voltar
        </button>
        <h1 className="kanban-page-title">{board.nome}</h1>
        <span className="kanban-board-stats">
          {cards.length} cards • {columns.length} colunas
        </span>
        <button
          type="button"
          className="btn btn-primary kanban-add-column-header-btn"
          onClick={handleAddColumn}
          disabled={addColumn.isPending}
          aria-label="Adicionar nova coluna"
          title="Adicionar coluna"
        >
          <span aria-hidden>+</span>
          {addColumn.isPending ? 'Criando…' : 'Nova coluna'}
        </button>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns-wrap">
          <SortableContext
            items={sortedColumns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="kanban-columns">
              {sortedColumns.map((col) => {
                const columnCards = cards
                  .filter((c) => c.columnId === col.id)
                  .sort((a, b) => a.ordem - b.ordem)
                const isOverWip = col.wipLimit != null && columnCards.length > col.wipLimit
                return (
                  <SortableColumn
                    key={col.id}
                    config={{
                      column: col,
                      isOverWip,
                      columnCards,
                      loadingCards: loadingCards ?? false,
                      newCardTitulo,
                      setNewCardTitulo,
                      onAddCard: handleAddCard,
                      onOpenCard: (id) => navigate(`/cards/${id}`),
                      onSettings: setEditingColumn,
                      createCardPending: createCard.isPending,
                    }}
                  />
                )
              })}
            </div>
          </SortableContext>
        </div>

        <DragOverlay>
          <KanbanDragOverlayContent
            activeCard={activeCard}
            activeColumn={activeColumn}
          />
        </DragOverlay>
      </DndContext>

      {editingColumn && (
        <ColumnSettingsModal
          column={editingColumn}
          onClose={() => setEditingColumn(null)}
          onSave={handleColumnSave}
          onDelete={handleColumnDelete}
        />
      )}
    </div>
  )
}
