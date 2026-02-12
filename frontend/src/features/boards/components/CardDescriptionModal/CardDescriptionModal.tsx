import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'

interface CardDescriptionModalProps {
  titulo: string
  descricao: string
  onClose: () => void
}

export function CardDescriptionModal({ titulo, descricao, onClose }: Readonly<CardDescriptionModalProps>) {
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-desc-modal-title"
    >
      <div
        className="modal-content modal-content-wide"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <header className="modal-header">
          <h2 id="card-desc-modal-title" className="modal-title">
            {titulo}
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
          <div className="card-detail-markdown">
            <MarkdownWithCode>{descricao}</MarkdownWithCode>
          </div>
        </div>
      </div>
    </div>
  )
}
