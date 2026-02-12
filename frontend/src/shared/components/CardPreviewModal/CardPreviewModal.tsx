import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCard } from '@/features/cards/api/useCardActions'
import { useComments, useChecklist } from '@/features/cards/api/useCardExtras'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'

interface CardPreviewModalProps {
  readonly cardId: string
  readonly onClose: () => void
}

export function CardPreviewModal({ cardId, onClose }: CardPreviewModalProps) {
  const navigate = useNavigate()
  const backdropRef = useRef<HTMLDivElement>(null)
  const { data: card, isLoading } = useCard(cardId)
  const { data: commentsData } = useComments(cardId)
  const { data: checklist } = useChecklist(cardId)

  const comments = commentsData?.content ?? []
  const checklistItems = checklist ?? []
  const checklistDone = checklistItems.filter((i) => i.concluido).length

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose()
  }

  const handleGoToCard = () => {
    onClose()
    navigate(`/cards/${cardId}`)
  }

  const statusLabel: Record<string, string> = {
    Todo: '📋 To Do',
    InProgress: '🔧 In Progress',
    Done: '✅ Done',
  }

  const isOverdue = card?.dueDate && new Date(card.dueDate) < new Date() && card.status !== 'Done'

  return (
    <div
      ref={backdropRef}
      className="card-preview-backdrop"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div className="card-preview-modal" aria-label="Preview do card">
        {/* Header */}
        <div className="card-preview-header">
          <h2 className="card-preview-title-text">
            {isLoading ? 'Carregando…' : card?.titulo}
          </h2>
          <div className="card-preview-header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleGoToCard}
              title="Abrir card completo"
            >
              ↗ Ir para card
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        {isLoading || !card ? (
          <div className="card-preview-body">
            <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 80, width: '100%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 20, width: '40%' }} />
          </div>
        ) : (
          <div className="card-preview-body">
            {/* Meta info */}
            <div className="card-preview-meta">
              <span className={`status-badge status-${card.status.toLowerCase()}`}>
                {statusLabel[card.status] ?? card.status}
              </span>
              {card.dueDate && (
                <span className={`card-preview-due ${isOverdue ? 'card-preview-due--overdue' : ''}`}>
                  📅 {new Date(card.dueDate).toLocaleDateString('pt-BR')}
                  {isOverdue && ' (atrasado)'}
                </span>
              )}
              <span className="card-preview-created">
                Criado em {new Date(card.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Descrição */}
            <section className="card-preview-section">
              <h3 className="card-preview-section-title">📝 Descrição</h3>
              {card.descricao ? (
                <div className="card-preview-description">
                  <MarkdownWithCode>{card.descricao}</MarkdownWithCode>
                </div>
              ) : (
                <p className="card-preview-empty">Sem descrição.</p>
              )}
            </section>

            {/* Subtarefas */}
            {checklistItems.length > 0 && (
              <section className="card-preview-section">
                <h3 className="card-preview-section-title">
                  ☑️ Subtarefas ({checklistDone}/{checklistItems.length})
                </h3>
                <div className="card-preview-checklist-progress">
                  <div
                    className="card-preview-checklist-bar"
                    style={{ width: `${(checklistDone / checklistItems.length) * 100}%` }}
                  />
                </div>
                <ul className="card-preview-checklist">
                  {checklistItems.map((item) => (
                    <li
                      key={item.id}
                      className={`card-preview-check-item ${item.concluido ? 'card-preview-check-done' : ''}`}
                    >
                      <span className="card-preview-check-icon">
                        {item.concluido ? '✓' : '○'}
                      </span>
                      <span>{item.texto}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Comentários */}
            {comments.length > 0 && (
              <section className="card-preview-section">
                <h3 className="card-preview-section-title">💬 Comentários ({comments.length})</h3>
                <ul className="card-preview-comments">
                  {comments.slice(0, 5).map((c) => (
                    <li key={c.id} className="card-preview-comment">
                      <span className="card-preview-comment-author">{c.autor}</span>
                      <span className="card-preview-comment-date">
                        {new Date(c.createdAt).toLocaleString('pt-BR')}
                      </span>
                      <div className="card-preview-comment-body">
                        <MarkdownWithCode>{c.texto}</MarkdownWithCode>
                      </div>
                    </li>
                  ))}
                  {comments.length > 5 && (
                    <li className="card-preview-comment-more">
                      + {comments.length - 5} comentário(s)…
                    </li>
                  )}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="card-preview-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGoToCard}
          >
            ↗ Abrir card completo
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
