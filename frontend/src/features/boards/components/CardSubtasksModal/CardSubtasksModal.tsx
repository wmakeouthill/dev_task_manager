import type { ChecklistItemData } from '@/shared/types'

interface CardSubtasksModalProps {
  titulo: string
  items: ChecklistItemData[]
  onClose: () => void
}

export function CardSubtasksModal({ titulo, items, onClose }: Readonly<CardSubtasksModalProps>) {
  const sorted = [...items].sort((a, b) => a.ordem - b.ordem)

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-subtasks-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <header className="modal-header">
          <h2 id="card-subtasks-modal-title" className="modal-title">
            📋 Subtarefas — {titulo}
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>
        <div className="modal-body">
          <ul className="card-subtasks-modal-list" aria-label="Subtarefas">
            {sorted.map((item) => (
              <li key={item.id} className="card-subtasks-modal-item">
                <span className="card-subtasks-modal-icon" aria-hidden>
                  {item.concluido ? '☑' : '☐'}
                </span>
                <span
                  className="card-subtasks-modal-text"
                  style={{
                    color: item.concluido ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: item.concluido ? 'line-through' : 'none',
                  }}
                >
                  {item.texto}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
