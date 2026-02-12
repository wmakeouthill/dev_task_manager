import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableCard } from '@/features/boards/components/SortableCard'
import type { SortableColumnProps } from './SortableColumn.types'

export function SortableColumn({ config }: Readonly<SortableColumnProps>) {
  const {
    column: col,
    isOverWip,
    columnCards,
    loadingCards,
    newCardTitulo,
    setNewCardTitulo,
    onAddCard,
    onOpenCard,
    onSettings,
    createCardPending,
  } = config

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'column' as const, column: col },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`kanban-column ${isOverWip ? 'kanban-column-over-wip' : ''}`}
      aria-labelledby={`col-${col.id}`}
    >
      <div className="kanban-column-header">
        <span
          className="kanban-column-drag-handle"
          {...attributes}
          {...listeners}
          title="Arrastar para reordenar coluna"
          aria-label="Arrastar coluna"
        >
          ⋮⋮
        </span>
        <h2 id={`col-${col.id}`} className="kanban-column-title">
          {col.nome}
          <span className="kanban-column-count">
            {columnCards.length}
            {col.wipLimit !== undefined && col.wipLimit !== null ? `/${col.wipLimit}` : ''}
          </span>
        </h2>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm kanban-column-settings-btn"
          onClick={() => onSettings(col)}
          aria-label={`Configurações da coluna ${col.nome}`}
          title="Configurar coluna"
        >
          ✏️
        </button>
      </div>
      {isOverWip && (
        <div className="kanban-wip-warning">
          ⚠️ WIP excedido ({columnCards.length}/{col.wipLimit})
        </div>
      )}
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
              <SortableCard key={card.id} card={card} onOpen={onOpenCard} />
            ))
          )}
        </ul>
      </SortableContext>
      <form className="kanban-add-card form-inline" onSubmit={(e) => onAddCard(e, col.id)}>
        <input
          className="input"
          value={newCardTitulo[col.id] ?? ''}
          onChange={(e) => setNewCardTitulo((prev) => ({ ...prev, [col.id]: e.target.value }))}
          placeholder="Novo card…"
          aria-label={`Novo card em ${col.nome}`}
        />
        <button type="submit" className="btn btn-primary btn-icon" disabled={createCardPending}>
          +
        </button>
      </form>
    </section>
  )
}
