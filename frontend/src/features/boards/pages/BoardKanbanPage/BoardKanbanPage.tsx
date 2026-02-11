import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBoard, useAddColumn } from '@/features/boards'
import { useCards, useCreateCard, useMoveCard } from '@/features/cards'
import type { ColumnDto } from '@/features/boards/types/board.types'

export function BoardKanbanPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const [newColumnNome, setNewColumnNome] = useState('')
  const [newCardTitulo, setNewCardTitulo] = useState<Record<string, string>>({})

  const { data: board, isLoading: loadingBoard } = useBoard(boardId ?? null)
  const { data: cardsData, isLoading: loadingCards } = useCards(boardId ?? null)
  const addColumn = useAddColumn(boardId ?? null)
  const createCard = useCreateCard(boardId ?? null)
  const moveCard = useMoveCard(boardId ?? null)

  const columns: ColumnDto[] = board?.columns ?? []
  const cards = cardsData?.content ?? []

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

  const handleMoveCard = (cardId: string, columnId: string, ordem: number) => {
    moveCard.mutate({ id: cardId, data: { columnId, ordem } })
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

  return (
    <div className="page">
      <header className="kanban-header">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => navigate('/boards')}
          aria-label="Voltar para lista de boards"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ marginRight: 6 }}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          {board.nome}
        </h1>
      </header>

      <form onSubmit={handleAddColumn} className="kanban-add-column form-inline">
        <input
          id="new-column-nome"
          className="input"
          value={newColumnNome}
          onChange={(e) => setNewColumnNome(e.target.value)}
          placeholder="Nova coluna…"
          aria-describedby="new-column-error"
          style={{ maxWidth: 240 }}
        />
        <button type="submit" className="btn btn-secondary" disabled={addColumn.isPending}>
          {addColumn.isPending ? 'Adicionando…' : 'Adicionar coluna'}
        </button>
        {addColumn.isError && (
          <span id="new-column-error" className="alert alert-error" role="alert" style={{ marginLeft: 8 }}>
            Erro ao adicionar coluna.
          </span>
        )}
      </form>

      <div className="kanban-columns">
        {columns
          .slice()
          .sort((a, b) => a.ordem - b.ordem)
          .map((col) => {
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
                  {col.wipLimit != null && (
                    <span className="kanban-column-count">
                      {' '}({columnCards.length}/{col.wipLimit})
                    </span>
                  )}
                </h2>

                <ul className="kanban-cards" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {loadingCards ? (
                    <li className="loading-text">Carregando…</li>
                  ) : (
                    columnCards.map((card) => (
                      <li key={card.id} className="kanban-card">
                        <div className="kanban-card-header">
                          <span className="kanban-card-title">{card.titulo}</span>
                          <div className="kanban-card-actions">
                            <select
                              className="select"
                              aria-label={`Mover "${card.titulo}" para outra coluna`}
                              value=""
                              onChange={(e) => {
                                const targetColId = e.target.value
                                if (!targetColId) return
                                const targetCards = cards.filter((c) => c.columnId === targetColId)
                                handleMoveCard(card.id, targetColId, targetCards.length)
                                e.target.value = ''
                              }}
                            >
                              <option value="">Mover…</option>
                              {columns
                                .filter((c) => c.id !== col.id)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.nome}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                        <div className="kanban-card-meta">{card.status}</div>
                      </li>
                    ))
                  )}
                </ul>

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
                    placeholder="Novo card"
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
    </div>
  )
}
