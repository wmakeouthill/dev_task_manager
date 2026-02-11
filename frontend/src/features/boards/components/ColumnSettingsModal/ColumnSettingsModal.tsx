import { useState, type FormEvent } from 'react'
import type { ColumnDto } from '@/features/boards/types/board.types'
import type { UpdateColumnRequest } from '@/features/boards/api/columnApi'

interface ColumnSettingsModalProps {
  column: ColumnDto
  onClose: () => void
  onSave: (data: UpdateColumnRequest) => void
  onDelete: () => void
}

export function ColumnSettingsModal({ column, onClose, onSave, onDelete }: ColumnSettingsModalProps) {
  const [nome, setNome] = useState(column.nome)
  const [wipLimit, setWipLimit] = useState<string>(column.wipLimit?.toString() ?? '')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const parsedWip = wipLimit.trim() ? parseInt(wipLimit, 10) : null
    onSave({
      nome: nome.trim() || null,
      wipLimit: parsedWip && !isNaN(parsedWip) && parsedWip > 0 ? parsedWip : null,
    })
    onClose()
  }

  const handleDelete = () => {
    if (confirm(`Excluir a coluna "${column.nome}"? Os cards serão perdidos.`)) {
      onDelete()
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <header className="modal-header">
          <h2 className="modal-title">⚙️ Configurações da Coluna</h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="settings-field">
              <label className="label" htmlFor="col-nome">Nome da coluna</label>
              <input
                id="col-nome"
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome da coluna"
                required
                autoFocus
              />
            </div>

            <div className="settings-field">
              <label className="label" htmlFor="col-wip">Limite WIP (Work In Progress)</label>
              <input
                id="col-wip"
                className="input"
                type="number"
                min={0}
                value={wipLimit}
                onChange={(e) => setWipLimit(e.target.value)}
                placeholder="Sem limite (deixe vazio)"
              />
              <p className="settings-hint">
                Defina o número máximo de cards permitidos nesta coluna. Deixe vazio para sem limite.
              </p>
            </div>
          </div>

          <footer className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              🗑️ Excluir coluna
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Salvar
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
