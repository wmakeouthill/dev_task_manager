import type { ChecklistItemData } from '@/shared/types'

interface SubtaskModalProps {
  item: ChecklistItemData
  onClose: () => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function SubtaskModal({ item, onClose, onToggle, onDelete }: SubtaskModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <header className="modal-header">
          <h2 className="modal-title">📋 Subtarefa</h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </header>

        <div className="modal-body">
          <div className="subtask-detail">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <button
                type="button"
                className={`checklist-checkbox ${item.concluido ? 'checked' : ''}`}
                onClick={() => onToggle(item.id)}
                aria-label={item.concluido ? 'Desmarcar' : 'Marcar como concluído'}
              >
                {item.concluido ? '✓' : ''}
              </button>
              <span style={{ fontSize: '1.125rem', fontWeight: 600, color: item.concluido ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.concluido ? 'line-through' : 'none' }}>
                {item.texto}
              </span>
            </div>

            <div className="subtask-meta">
              <span className={`status-badge ${item.concluido ? 'done' : 'todo'}`}>
                {item.concluido ? 'Concluído' : 'Pendente'}
              </span>
              <span className="meta-item">
                Criado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              onDelete(item.id)
              onClose()
            }}
          >
            🗑️ Excluir subtarefa
          </button>
        </footer>
      </div>
    </div>
  )
}
