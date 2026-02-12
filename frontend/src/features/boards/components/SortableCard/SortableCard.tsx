import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SortableCardProps } from './SortableCard.types'

const MAX_DESC_LINES = 4
const MAX_SUBTASKS_PREVIEW = 2

export function SortableCard({ card, onOpen, checklistItems = [] }: Readonly<SortableCardProps>) {
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
      {card.descricao ? (
        <div className="kanban-card-desc" data-line-clamp={MAX_DESC_LINES}>
          <div className="kanban-card-desc-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.descricao}</ReactMarkdown>
          </div>
        </div>
      ) : null}
      {(() => {
        if (checklistItems.length === 0) return null
        const sorted = [...checklistItems].sort((a, b) => a.ordem - b.ordem)
        const preview = sorted.slice(0, MAX_SUBTASKS_PREVIEW)
        const moreCount = sorted.length - MAX_SUBTASKS_PREVIEW
        return (
          <ul className="kanban-card-subtasks" aria-label="Subtarefas">
            {preview.map((item) => (
              <li key={item.id} className="kanban-card-subtask">
                <span className="kanban-card-subtask-icon" aria-hidden>
                  {item.concluido ? '☑' : '☐'}
                </span>
                <span className="kanban-card-subtask-text">{item.texto}</span>
              </li>
            ))}
            {moreCount > 0 ? (
              <li className="kanban-card-subtask-more">+{moreCount} mais</li>
            ) : null}
          </ul>
        )
      })()}
    </li>
  )
}
