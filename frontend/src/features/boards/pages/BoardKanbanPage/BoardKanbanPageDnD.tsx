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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBoard, useAddColumn } from '@/features/boards'
import { useCards, useCreateCard, useMoveCard } from '@/features/cards'
import type { ColumnDto } from '@/features/boards/types/board.types'
import type { Card } from '@/features/cards/types/card.types'

function SortableCard({
  card,
  onOpen,
}: {
  card: Card
  onOpen: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: 'card', card } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <button
          type="button"
          className="kanban-card-title"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(card.id)
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, color: 'inherit', font: 'inherit', fontWeight: 500 }}
        >
          {card.titulo}
        </button>
      </div>
      <div className="kanban-card-meta">
        <span className={`status-dot-sm status-${card.status.toLowerCase()}`} />
        {card.status}
        {card.dueDate && (
          <span className="kanban-card-due">
            {' '}• 📅 {new Date(card.dueDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
      {card.descricao && (
        <p className="kanban-card-desc">{card.descricao.slice(0, 80)}{card.descricao.length > 80 ? '…' : ''}</p>
      )}
    </li>
  )
}

export function BoardKanbanPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const [newColumnNome, setNewColumnNome] = useState('')
  const [newCardTitulo, setNewCardTitulo] = useState<Record<string, string>>({})
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const { data: board, isLoading: loadingBoard } = useBoard(boardId ?? null)
  const { data: cardsData, isLoading: loadingCards } = useCards(boardId ?? null)
  const addColumn = useAddColumn(boardId ?? null)
  const createCard = useCreateCard(boardId ?? null)
  const moveCard = useMoveCard(boardId ?? null)

  const columns: ColumnDto[] = board?.columns ?? []
  const cards = cardsData?.content ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnNome.trim()) return
    addColumn.mutate(
      { nome: newColumnNome.trim(), ordem: columns.length },
      { onSuccess: () => setNewColumnNome('') }
    )
  }

  const handleAddCard = (e: React.FormEvent, columnId: string) => {
    e.preventDefault()
    const titulo = newCardTitulo[columnId]?.trim()
    if (!titulo) return
    createCard.mutate(
      { columnId, titulo, ordem: cards.filter((c) => c.columnId === columnId).length },
      {
        onSuccess: () =>
          setNewCardTitulo((prev) => ({ ...prev, [columnId]: '' })),
      }
    )
  }

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const draggedCard = cards.find((c) => c.id === active.id)
    if (!draggedCard) return

    // Determine target column
    let targetColumnId: string
    let targetOrder: number

    const overCard = cards.find((c) => c.id === over.id)
    if (overCard) {
      // Dropped on another card
      targetColumnId = overCard.columnId
      targetOrder = overCard.ordem
    } else {
      // Dropped on a column directly
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
          className="btn btn-ghost"
          onClick={() => navigate('/boards')}
          aria-label="Voltar para lista de boards"
        >
          ← Voltar
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          {board.nome}
        </h1>
        <span className="kanban-board-stats">
          {cards.length} cards • {columns.length} colunas
        </span>
      </header>

      <form onSubmit={handleAddColumn} className="kanban-add-column form-inline">
        <input
          className="input"
          value={newColumnNome}
          onChange={(e) => setNewColumnNome(e.target.value)}
          placeholder="Nova coluna…"
          style={{ maxWidth: 240 }}
        />
        <button type="submit" className="btn btn-secondary" disabled={addColumn.isPending}>
          {addColumn.isPending ? 'Adicionando…' : '+ Coluna'}
        </button>
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {sortedColumns.map((col) => {
            const columnCards = cards
              .filter((c) => c.columnId === col.id)
              .sort((a, b) => a.ordem - b.ordem)

            return (
              <section
                key={col.id}
                className="kanban-column"
                aria-labelledby={`col-${col.id}`}
              >
                <h2 id={`col-${col.id}`} className="kanban-column-title">
                  {col.nome}
                  <span className="kanban-column-count">
                    {columnCards.length}
                    {col.wipLimit != null ? `/${col.wipLimit}` : ''}
                  </span>
                </h2>

                <SortableContext
                  items={columnCards.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                  id={col.id}
                >
                  <ul className="kanban-cards" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {loadingCards ? (
                      <li className="loading-text">Carregando…</li>
                    ) : (
                      columnCards.map((card) => (
                        <SortableCard
                          key={card.id}
                          card={card}
                          onOpen={(id) => navigate(`/cards/${id}`)}
                        />
                      ))
                    )}
                  </ul>
                </SortableContext>

                <form
                  className="kanban-add-card form-inline"
                  onSubmit={(e) => handleAddCard(e, col.id)}
                >
                  <input
                    className="input"
                    value={newCardTitulo[col.id] ?? ''}
                    onChange={(e) =>
                      setNewCardTitulo((prev) => ({ ...prev, [col.id]: e.target.value }))
                    }
                    placeholder="Novo card…"
                    aria-label={`Novo card em ${col.nome}`}
                  />
                  <button type="submit" className="btn btn-primary btn-icon" disabled={createCard.isPending}>
                    +
                  </button>
                </form>
              </section>
            )
          })}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="kanban-card kanban-card-dragging">
              <span className="kanban-card-title">{activeCard.titulo}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
