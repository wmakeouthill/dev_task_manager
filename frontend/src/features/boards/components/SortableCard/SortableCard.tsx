import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { SortableCardProps } from './SortableCard.types'

export function SortableCard({ card, onOpen }: Readonly<SortableCardProps>) {
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
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0,
            color: 'inherit',
            font: 'inherit',
            fontWeight: 500,
          }}
        >
          {card.titulo}
        </button>
        {card.aiEnabled && (
          <span className="kanban-card-ai-badge" title="IA habilitada">
            🤖
          </span>
        )}
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
        <p className="kanban-card-desc">
          {card.descricao.slice(0, 80)}
          {card.descricao.length > 80 ? '…' : ''}
        </p>
      )}
    </li>
  )
}
