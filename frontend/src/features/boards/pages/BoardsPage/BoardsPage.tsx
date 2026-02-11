import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaces, useCreateWorkspace } from '@/features/workspaces'
import { useBoards, useCreateBoard } from '@/features/boards'
import type { BoardsPageProps } from './BoardsPage.types'

const OWNER_ID_LOCAL = 'local-dev'

export function BoardsPage(_props: BoardsPageProps) {
  const navigate = useNavigate()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  )
  const [newWorkspaceNome, setNewWorkspaceNome] = useState('')
  const [newBoardNome, setNewBoardNome] = useState('')

  const { data: workspacesData, isLoading: loadingWorkspaces } = useWorkspaces()
  const createWorkspace = useCreateWorkspace()

  const { data: boardsData, isLoading: loadingBoards } = useBoards(
    selectedWorkspaceId
  )
  const createBoard = useCreateBoard(selectedWorkspaceId)

  const workspaces = workspacesData?.content ?? []
  const boards = boardsData?.content ?? []

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceNome.trim()) return
    createWorkspace.mutate(
      { nome: newWorkspaceNome.trim(), ownerId: OWNER_ID_LOCAL },
      {
        onSuccess: (w) => {
          setSelectedWorkspaceId(w.id)
          setNewWorkspaceNome('')
        },
      }
    )
  }

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkspaceId || !newBoardNome.trim()) return
    createBoard.mutate(
      { nome: newBoardNome.trim() },
      {
        onSuccess: () => setNewBoardNome(''),
      }
    )
  }

  if (loadingWorkspaces) {
    return (
      <div className="page">
        <h1 className="page-title">Boards</h1>
        <p className="loading-text">Carregando workspaces…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">Boards</h1>

      <div className="page-grid">
        <section aria-labelledby="workspaces-heading" className="card">
          <h2 id="workspaces-heading" className="section-title">
            Workspaces
          </h2>
          <ul className="card-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {workspaces.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className={`card-item ${selectedWorkspaceId === w.id ? 'active' : ''}`}
                  style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }}
                  onClick={() => setSelectedWorkspaceId(w.id)}
                  aria-pressed={selectedWorkspaceId === w.id}
                >
                  {w.nome}
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleCreateWorkspace} style={{ marginTop: 14 }}>
            <label htmlFor="new-workspace-nome" className="label">
              Novo workspace
            </label>
            <div className="form-row">
              <input
                id="new-workspace-nome"
                className="input"
                value={newWorkspaceNome}
                onChange={(e) => setNewWorkspaceNome(e.target.value)}
                placeholder="Nome do workspace"
                aria-describedby="new-workspace-error"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createWorkspace.isPending}
              >
                {createWorkspace.isPending ? 'Criando…' : 'Criar'}
              </button>
            </div>
            {createWorkspace.isError && (
              <p id="new-workspace-error" className="alert alert-error" style={{ marginTop: 8 }}>
                Erro ao criar workspace.
              </p>
            )}
          </form>
        </section>

        <section aria-labelledby="boards-heading" className="card">
          <h2 id="boards-heading" className="section-title">
            Boards
          </h2>
          {!selectedWorkspaceId ? (
            <p className="loading-text">Selecione um workspace.</p>
          ) : loadingBoards ? (
            <p className="loading-text">Carregando boards…</p>
          ) : (
            <>
              <ul className="card-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {boards.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      className="card-item"
                      style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }}
                      onClick={() => navigate(`/boards/${b.id}`)}
                    >
                      <span>{b.nome}</span>
                      {b.columns.length > 0 && (
                        <span className="kanban-column-count">
                          {b.columns.length} coluna(s)
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleCreateBoard} style={{ marginTop: 14 }}>
                <label htmlFor="new-board-nome" className="label">
                  Novo board
                </label>
                <div className="form-row">
                  <input
                    id="new-board-nome"
                    className="input"
                    value={newBoardNome}
                    onChange={(e) => setNewBoardNome(e.target.value)}
                    placeholder="Nome do board"
                    aria-describedby="new-board-error"
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createBoard.isPending}
                  >
                    {createBoard.isPending ? 'Criando…' : 'Criar'}
                  </button>
                </div>
                {createBoard.isError && (
                  <p id="new-board-error" className="alert alert-error" style={{ marginTop: 8 }}>
                    Erro ao criar board.
                  </p>
                )}
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
