import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import { CardDescriptionModal } from '@/features/boards/components/CardDescriptionModal/CardDescriptionModal'
import { CardSubtasksModal } from '@/features/boards/components/CardSubtasksModal/CardSubtasksModal'
import type { SortableCardProps } from './SortableCard.types'

const MAX_DESC_LINES = 4
const MAX_SUBTASKS_PREVIEW = 2

export function SortableCard({ card, onOpen, checklistItems = [] }: Readonly<SortableCardProps>) {
  const [showDescModal, setShowDescModal] = useState(false)
  const [showSubtasksModal, setShowSubtasksModal] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: 'card', card } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const sortedItems = [...checklistItems].sort((a, b) => a.ordem - b.ordem)
  const preview = sortedItems.slice(0, MAX_SUBTASKS_PREVIEW)
  const moreCount = sortedItems.length - MAX_SUBTASKS_PREVIEW

  return (
    <li ref={setNodeRef} style={style} className="kanban-card">
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
        <div className="kanban-card-header-right">
          {card.aiEnabled && (
            <span className="kanban-card-ai-badge" title="IA habilitada">
              🤖
            </span>
          )}
          <span
            className="kanban-card-drag-handle"
            {...attributes}
            {...listeners}
            title="Arrastar"
            aria-label="Arrastar card"
          >
            ⋮⋮
          </span>
        </div>
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
        <button
          type="button"
          className="kanban-card-desc kanban-card-desc-clickable"
          data-line-clamp={MAX_DESC_LINES}
          onClick={(e) => {
            e.stopPropagation()
            setShowDescModal(true)
          }}
          title="Clique para ver descrição completa"
        >
          <span className="kanban-card-desc-markdown">
            <MarkdownWithCode>{card.descricao}</MarkdownWithCode>
          </span>
        </button>
      ) : null}
      {checklistItems.length > 0 ? (
        <button
          type="button"
          className="kanban-card-subtasks-wrap"
          onClick={(e) => {
            e.stopPropagation()
            setShowSubtasksModal(true)
          }}
          title="Clique para ver todas as subtarefas"
        >
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
        </button>
      ) : null}
      {showDescModal && (
        <CardDescriptionModal
          titulo={card.titulo}
          descricao={card.descricao ?? ''}
          onClose={() => setShowDescModal(false)}
        />
      )}
      {showSubtasksModal && (
        <CardSubtasksModal
          titulo={card.titulo}
          items={checklistItems}
          onClose={() => setShowSubtasksModal(false)}
        />
      )}
    </li>
  )
}
