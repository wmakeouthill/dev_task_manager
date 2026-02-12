import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaces, useCreateWorkspace, useUpdateWorkspace, useDeleteWorkspace } from '@/features/workspaces'
import { useBoards, useCreateBoard, useUpdateBoard, useDeleteBoard } from '@/features/boards'
import { useBoardsNavigation } from '@/shared/hooks/useBoardsNavigation'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog/ConfirmDialog'
import { Breadcrumb } from '@/shared/components/Breadcrumb/Breadcrumb'
import type { Workspace } from '@/features/workspaces'
import type { Board } from '@/features/boards'
import type { BoardsPageProps } from './BoardsPage.types'

const OWNER_ID_LOCAL = 'local-dev'

export function BoardsPage(_props: BoardsPageProps) {
  const navigate = useNavigate()
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useBoardsNavigation()
  const [newWorkspaceNome, setNewWorkspaceNome] = useState('')
  const [newBoardNome, setNewBoardNome] = useState('')

  // Editing state
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [editWorkspaceName, setEditWorkspaceName] = useState('')
  const [editBoardName, setEditBoardName] = useState('')
  const editWorkspaceRef = useRef<HTMLInputElement>(null)
  const editBoardRef = useRef<HTMLInputElement>(null)

  // Delete confirmation state
  const [deleteWorkspaceTarget, setDeleteWorkspaceTarget] = useState<Workspace | null>(null)
  const [deleteBoardTarget, setDeleteBoardTarget] = useState<Board | null>(null)

  const { data: workspacesData, isLoading: loadingWorkspaces } = useWorkspaces()
  const createWorkspace = useCreateWorkspace()
  const updateWorkspace = useUpdateWorkspace()
  const deleteWorkspace = useDeleteWorkspace()

  const { data: boardsData, isLoading: loadingBoards } = useBoards(selectedWorkspaceId)
  const createBoard = useCreateBoard(selectedWorkspaceId)
  const updateBoard = useUpdateBoard()
  const deleteBoard = useDeleteBoard(selectedWorkspaceId)

  const workspaces = workspacesData?.content ?? []
  const boards = boardsData?.content ?? []
  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId) ?? null

  // Auto-select first workspace if none selected or if selected was deleted
  useEffect(() => {
    if (!loadingWorkspaces && workspaces.length > 0 && !workspaces.some((w) => w.id === selectedWorkspaceId)) {
      setSelectedWorkspaceId(workspaces[0].id)
    }
  }, [workspaces, selectedWorkspaceId, loadingWorkspaces, setSelectedWorkspaceId])

  // Focus editing inputs
  useEffect(() => {
    if (editingWorkspace) editWorkspaceRef.current?.focus()
  }, [editingWorkspace])
  useEffect(() => {
    if (editingBoard) editBoardRef.current?.focus()
  }, [editingBoard])

  // --- Workspace handlers ---
  const handleCreateWorkspace = (e: FormEvent<HTMLFormElement>) => {
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

  const startEditWorkspace = (w: Workspace) => {
    setEditingWorkspace(w)
    setEditWorkspaceName(w.nome)
  }

  const handleSaveWorkspace = () => {
    if (!editingWorkspace || !editWorkspaceName.trim()) return
    if (editWorkspaceName.trim() === editingWorkspace.nome) {
      setEditingWorkspace(null)
      return
    }
    updateWorkspace.mutate(
      { id: editingWorkspace.id, data: { nome: editWorkspaceName.trim() } },
      { onSuccess: () => setEditingWorkspace(null) }
    )
  }

  const handleConfirmDeleteWorkspace = () => {
    if (!deleteWorkspaceTarget) return
    const deletingId = deleteWorkspaceTarget.id
    deleteWorkspace.mutate(deletingId, {
      onSuccess: () => {
        if (selectedWorkspaceId === deletingId) {
          setSelectedWorkspaceId(null)
        }
        setDeleteWorkspaceTarget(null)
      },
    })
  }

  // --- Board handlers ---
  const handleCreateBoard = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedWorkspaceId || !newBoardNome.trim()) return
    createBoard.mutate(
      { nome: newBoardNome.trim() },
      { onSuccess: () => setNewBoardNome('') }
    )
  }

  const startEditBoard = (b: Board) => {
    setEditingBoard(b)
    setEditBoardName(b.nome)
  }

  const handleSaveBoard = () => {
    if (!editingBoard || !editBoardName.trim()) return
    if (editBoardName.trim() === editingBoard.nome) {
      setEditingBoard(null)
      return
    }
    updateBoard.mutate(
      { id: editingBoard.id, data: { nome: editBoardName.trim() } },
      { onSuccess: () => setEditingBoard(null) }
    )
  }

  const handleConfirmDeleteBoard = () => {
    if (!deleteBoardTarget) return
    deleteBoard.mutate(deleteBoardTarget.id, {
      onSuccess: () => setDeleteBoardTarget(null),
    })
  }

  // --- Breadcrumb ---
  const breadcrumbItems = [
    { label: '📋 Boards' },
    ...(selectedWorkspace ? [{ label: selectedWorkspace.nome }] : []),
  ]

  // --- Boards content renderer (avoids nested ternary) ---
  const renderBoardsContent = () => {
    if (!selectedWorkspaceId) {
      return (
        <div className="boards-empty-state">
          <span className="boards-empty-icon">📋</span>
          <p>Selecione um workspace para ver seus boards.</p>
        </div>
      )
    }

    if (loadingBoards) {
      return <p className="loading-text">Carregando boards…</p>
    }

    return (
      <>
        {boards.length === 0 ? (
          <div className="boards-empty-state">
            <span className="boards-empty-icon">📝</span>
            <p>Nenhum board neste workspace ainda.</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Crie um board abaixo para começar.
            </p>
          </div>
        ) : (
          <div className="board-grid">
            {boards.map((b) => {
              const isEditing = editingBoard?.id === b.id

              if (isEditing) {
                return (
                  <div key={b.id} className="board-card editing">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSaveBoard()
                      }}
                    >
                      <input
                        ref={editBoardRef}
                        className="input"
                        value={editBoardName}
                        onChange={(e) => setEditBoardName(e.target.value)}
                        onBlur={handleSaveBoard}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingBoard(null)
                        }}
                      />
                    </form>
                  </div>
                )
              }

              return (
                <div key={b.id} className="board-card">
                  <button
                    type="button"
                    className="board-card-main"
                    onClick={() => navigate(`/boards/${b.id}`)}
                  >
                    <span className="board-card-name">{b.nome}</span>
                    <span className="board-card-meta">
                      {b.columns.length} coluna{b.columns.length === 1 ? '' : 's'}
                    </span>
                  </button>
                  <div className="board-card-actions">
                    <button
                      type="button"
                      className="btn-icon-action"
                      onClick={() => startEditBoard(b)}
                      title="Renomear board"
                      aria-label={`Renomear ${b.nome}`}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action danger"
                      onClick={() => setDeleteBoardTarget(b)}
                      title="Excluir board"
                      aria-label={`Excluir ${b.nome}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <form onSubmit={handleCreateBoard} className="boards-create-form">
          <input
            className="input input-sm"
            value={newBoardNome}
            onChange={(e) => setNewBoardNome(e.target.value)}
            placeholder="Novo board…"
            aria-label="Nome do novo board"
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={createBoard.isPending}
          >
            {createBoard.isPending ? '…' : '+'}
          </button>
        </form>
        {createBoard.isError && (
          <p className="alert alert-error" style={{ marginTop: 8 }}>
            Erro ao criar board.
          </p>
        )}
      </>
    )
  }

  if (loadingWorkspaces) {
    return (
      <div className="page">
        <h1 className="page-title">📋 Boards</h1>
        <p className="loading-text">Carregando workspaces…</p>
      </div>
    )
  }

  return (
    <div className="page boards-page">
      <Breadcrumb items={breadcrumbItems} />

      <div className="boards-layout">
        {/* Workspaces panel */}
        <section aria-labelledby="workspaces-heading" className="card boards-panel-workspaces">
          <div className="boards-panel-header">
            <h2 id="workspaces-heading" className="section-title" style={{ margin: 0 }}>
              Workspaces
            </h2>
            <span className="boards-panel-count">{workspaces.length}</span>
          </div>

          <ul className="workspace-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {workspaces.map((w) => {
              const isSelected = selectedWorkspaceId === w.id
              const isEditing = editingWorkspace?.id === w.id

              if (isEditing) {
                return (
                  <li key={w.id} className="workspace-item editing">
                    <form
                      className="workspace-edit-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSaveWorkspace()
                      }}
                    >
                      <input
                        ref={editWorkspaceRef}
                        className="input input-sm"
                        value={editWorkspaceName}
                        onChange={(e) => setEditWorkspaceName(e.target.value)}
                        onBlur={handleSaveWorkspace}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingWorkspace(null)
                        }}
                      />
                    </form>
                  </li>
                )
              }

              return (
                <li key={w.id} className={`workspace-item ${isSelected ? 'active' : ''}`}>
                  <button
                    type="button"
                    className="workspace-item-btn"
                    onClick={() => setSelectedWorkspaceId(w.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="workspace-item-icon">📁</span>
                    <span className="workspace-item-name">{w.nome}</span>
                  </button>
                  <div className="workspace-item-actions">
                    <button
                      type="button"
                      className="btn-icon-action"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditWorkspace(w)
                      }}
                      title="Renomear workspace"
                      aria-label={`Renomear ${w.nome}`}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteWorkspaceTarget(w)
                      }}
                      title="Excluir workspace"
                      aria-label={`Excluir ${w.nome}`}
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <form onSubmit={handleCreateWorkspace} className="boards-create-form">
            <input
              className="input input-sm"
              value={newWorkspaceNome}
              onChange={(e) => setNewWorkspaceNome(e.target.value)}
              placeholder="Novo workspace…"
              aria-label="Nome do novo workspace"
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={createWorkspace.isPending}
            >
              {createWorkspace.isPending ? '…' : '+'}
            </button>
          </form>
          {createWorkspace.isError && (
            <p className="alert alert-error" style={{ marginTop: 8 }}>
              Erro ao criar workspace.
            </p>
          )}
        </section>

        {/* Boards panel */}
        <section aria-labelledby="boards-heading" className="card boards-panel-boards">
          <div className="boards-panel-header">
            <h2 id="boards-heading" className="section-title" style={{ margin: 0 }}>
              Boards
            </h2>
            {selectedWorkspace && (
              <span className="boards-panel-count">{boards.length}</span>
            )}
          </div>

          {renderBoardsContent()}
        </section>
      </div>

      {/* Delete workspace confirmation */}
      <ConfirmDialog
        open={!!deleteWorkspaceTarget}
        title="Excluir workspace"
        message={`Tem certeza que deseja excluir o workspace "${deleteWorkspaceTarget?.nome}"? Todos os boards e cards dentro dele serão removidos permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir workspace"
        danger
        onConfirm={handleConfirmDeleteWorkspace}
        onCancel={() => setDeleteWorkspaceTarget(null)}
      />

      {/* Delete board confirmation */}
      <ConfirmDialog
        open={!!deleteBoardTarget}
        title="Excluir board"
        message={`Tem certeza que deseja excluir o board "${deleteBoardTarget?.nome}"? Todos os cards e colunas dentro dele serão removidos permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir board"
        danger
        onConfirm={handleConfirmDeleteBoard}
        onCancel={() => setDeleteBoardTarget(null)}
      />
    </div>
  )
}
