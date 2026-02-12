import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useBoard, useAddColumn, useUpdateColumn, useMoveColumn, useDeleteColumn } from '@/features/boards'
import { useCards, useCreateCard, useMoveCard } from '@/features/cards'
import { useWorkspace } from '@/features/workspaces'
import { checklistApi } from '@/features/cards/api/cardExtrasApi'
import type { ChecklistItemData } from '@/shared/types'
import { ColumnSettingsModal } from '@/features/boards/components/ColumnSettingsModal'
import { SortableColumn } from '@/features/boards/components/SortableColumn'
import { Breadcrumb } from '@/shared/components/Breadcrumb/Breadcrumb'
import type { ColumnDto } from '@/features/boards/types/board.types'
import type { Card } from '@/features/cards/types/card.types'
import type { UpdateColumnRequest } from '@/features/boards/api/columnApi'

/** Onde o cursor está = onde solta. Fallback para teclado. */
const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return closestCorners(args)
}

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
  const { data: workspace } = useWorkspace(board?.workspaceId ?? null)
  const addColumn = useAddColumn(boardId ?? null)

  // Persist workspace selection so going back to /boards shows the right workspace
  useEffect(() => {
    if (board?.workspaceId) {
      try {
        localStorage.setItem('boards-nav-selected-workspace', board.workspaceId)
      } catch { /* noop */ }
    }
  }, [board?.workspaceId])
  const updateColumn = useUpdateColumn(boardId ?? null)
  const moveColumn = useMoveColumn(boardId ?? null)
  const deleteColumn = useDeleteColumn(boardId ?? null)
  const createCard = useCreateCard(boardId ?? null)
  const moveCard = useMoveCard(boardId ?? null)

  const columns: ColumnDto[] = board?.columns ?? []
  const cards = cardsData?.content ?? []

  const checklistQueries = useQueries({
    queries: cards.map((c) => ({
      queryKey: ['checklist', c.id] as const,
      queryFn: () => checklistApi.listar(c.id),
      enabled: !!c.id,
    })),
  })

  const checklistByCardId = useMemo(() => {
    const m: Record<string, ChecklistItemData[]> = {}
    cards.forEach((c, i) => {
      const data = checklistQueries[i]?.data
      if (Array.isArray(data)) m[c.id] = data
    })
    return m
  }, [cards, checklistQueries])

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

  const breadcrumbItems = [
    { label: '📋 Boards', to: '/boards' },
    ...(workspace ? [{ label: workspace.nome, to: '/boards' }] : []),
    { label: board.nome },
  ]

  return (
    <div className="page kanban-page">
      <header className="kanban-header">
        <div className="kanban-header-title-block">
          <Breadcrumb items={breadcrumbItems} />
          <span className="kanban-board-stats">
            {cards.length} cards • {columns.length} colunas
          </span>
        </div>
        <div className="kanban-header-actions">
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
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollisionDetection}
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
                      checklistByCardId,
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
