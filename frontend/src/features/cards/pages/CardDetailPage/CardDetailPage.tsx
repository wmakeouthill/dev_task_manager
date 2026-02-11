import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useCard, useUpdateCard, useUpdateCardStatus, useDeleteCard } from '@/features/cards/api/useCardActions'
import {
  useComments, useAddComment, useDeleteComment,
  useChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem,
} from '@/features/cards/api/useCardExtras'
import { useAiAction } from '@/features/ai'
import { SubtaskModal } from '@/features/cards/components/SubtaskModal'
import type { ChecklistItemData } from '@/shared/types'

export function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const navigate = useNavigate()
  const { data: card, isLoading } = useCard(cardId ?? null)
  const updateCard = useUpdateCard(card?.boardId ?? null)
  const updateStatus = useUpdateCardStatus(card?.boardId ?? null)
  const deleteCard = useDeleteCard(card?.boardId ?? null)

  const { data: commentsData } = useComments(cardId ?? null)
  const addComment = useAddComment(cardId ?? null)
  const deleteComment = useDeleteComment(cardId ?? null)

  const { data: checklist } = useChecklist(cardId ?? null)
  const addChecklistItem = useAddChecklistItem(cardId ?? null)
  const toggleChecklistItem = useToggleChecklistItem(cardId ?? null)
  const deleteChecklistItem = useDeleteChecklistItem(cardId ?? null)

  const aiAction = useAiAction()

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [descInput, setDescInput] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newCheckItem, setNewCheckItem] = useState('')
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [showAi, setShowAi] = useState(false)
  const [selectedSubtask, setSelectedSubtask] = useState<ChecklistItemData | null>(null)
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [dueDateInput, setDueDateInput] = useState('')

  if (isLoading || !card) {
    return (
      <div className="page">
        <p className="loading-text">Carregando card…</p>
      </div>
    )
  }

  const comments = commentsData?.content ?? []
  const checklistItems = checklist ?? []
  const checklistDone = checklistItems.filter((i) => i.concluido).length

  const handleSaveTitle = () => {
    if (titleInput.trim() && titleInput.trim() !== card.titulo) {
      updateCard.mutate({ id: card.id, data: { titulo: titleInput.trim() } })
    }
    setEditingTitle(false)
  }

  const handleSaveDesc = () => {
    updateCard.mutate({ id: card.id, data: { descricao: descInput } })
    setEditingDesc(false)
  }

  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ id: card.id, data: { status } })
  }

  const handleDelete = () => {
    if (confirm('Excluir este card?')) {
      deleteCard.mutate(card.id, {
        onSuccess: () => navigate(-1),
      })
    }
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    addComment.mutate(newComment.trim(), {
      onSuccess: () => setNewComment(''),
    })
  }

  const handleAddCheckItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCheckItem.trim()) return
    addChecklistItem.mutate(
      { texto: newCheckItem.trim(), ordem: checklistItems.length },
      { onSuccess: () => setNewCheckItem('') }
    )
  }

  const handleAi = (action: string) => {
    aiAction.mutate(
      { action, cardId: card.id },
      { onSuccess: (res) => setAiResult(res.content) }
    )
  }

  const handleToggleAiEnabled = () => {
    updateCard.mutate({ id: card.id, data: { aiEnabled: !card.aiEnabled } })
  }

  const handleSaveDueDate = () => {
    const newDate = dueDateInput ? new Date(dueDateInput).toISOString() : null
    updateCard.mutate({ id: card.id, data: { dueDate: newDate } })
    setEditingDueDate(false)
  }

  return (
    <div className="page card-detail-page">
      {/* Header */}
      <header className="card-detail-header">
        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
          ← Voltar
        </button>
        <div className="card-detail-actions">
          <select
            className="select"
            value={card.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Status do card"
          >
            <option value="Todo">📋 To Do</option>
            <option value="InProgress">🔧 In Progress</option>
            <option value="Done">✅ Done</option>
          </select>
          <button type="button" className="btn btn-ghost" onClick={() => setShowAi(!showAi)}>
            🤖 IA
          </button>
          <button type="button" className="btn btn-ghost btn-danger" onClick={handleDelete}>
            🗑️
          </button>
        </div>
      </header>

      <div className="card-detail-layout">
        {/* Main content */}
        <div className="card-detail-main">
          {/* Title */}
          {editingTitle ? (
            <div className="card-detail-title-edit">
              <input
                className="input card-detail-title-input"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
              />
            </div>
          ) : (
            <h1
              className="card-detail-title"
              onClick={() => {
                setTitleInput(card.titulo)
                setEditingTitle(true)
              }}
              role="button"
              tabIndex={0}
            >
              {card.titulo}
            </h1>
          )}

          {/* Meta */}
          <div className="card-detail-meta">
            <span className={`status-badge status-${card.status.toLowerCase()}`}>
              {card.status}
            </span>
            {editingDueDate ? (
              <span className="meta-item" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  className="input"
                  type="date"
                  value={dueDateInput}
                  onChange={(e) => setDueDateInput(e.target.value)}
                  autoFocus
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8125rem' }}
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveDueDate}>✓</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingDueDate(false)}>✕</button>
              </span>
            ) : (
              <button
                type="button"
                className="meta-item meta-item-clickable"
                onClick={() => {
                  setDueDateInput(card.dueDate ? card.dueDate.split('T')[0] : '')
                  setEditingDueDate(true)
                }}
              >
                📅 {card.dueDate
                  ? new Date(card.dueDate).toLocaleDateString('pt-BR')
                  : 'Definir prazo'}
              </button>
            )}
            <span className="meta-item">
              Criado em {new Date(card.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {/* AI Toggle */}
          <div className="card-detail-ai-toggle">
            <button
              type="button"
              className={`btn btn-sm ${card.aiEnabled ? 'btn-ai-active' : 'btn-ghost'}`}
              onClick={handleToggleAiEnabled}
              title={card.aiEnabled ? 'IA gera insights deste card' : 'IA não gera insights deste card'}
            >
              🤖 {card.aiEnabled ? 'Insights IA: Ativado' : 'Insights IA: Desativado'}
            </button>
            <span className="settings-hint" style={{ margin: 0 }}>
              {card.aiEnabled
                ? 'Dados deste card serão enviados para gerar insights'
                : 'Este card não será usado para gerar insights (economiza tokens)'}
            </span>
          </div>

          {/* Description (Markdown) */}
          <section className="card-detail-section">
            <h2 className="section-title">📝 Descrição</h2>
            {editingDesc ? (
              <div className="card-detail-desc-edit">
                <textarea
                  className="input card-detail-textarea"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  rows={12}
                  placeholder="Escreva em Markdown..."
                  autoFocus
                />
                <div className="card-detail-desc-actions">
                  <button type="button" className="btn btn-primary" onClick={handleSaveDesc}>
                    Salvar
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditingDesc(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="card-detail-markdown"
                onClick={() => {
                  setDescInput(card.descricao ?? '')
                  setEditingDesc(true)
                }}
                role="button"
                tabIndex={0}
              >
                {card.descricao ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {card.descricao}
                  </ReactMarkdown>
                ) : (
                  <p className="loading-text">Clique para adicionar descrição em Markdown...</p>
                )}
              </div>
            )}
          </section>

          {/* Checklist / Subtasks */}
          <section className="card-detail-section">
            <h2 className="section-title">
              ☑️ Subtarefas
              {checklistItems.length > 0 && (
                <span className="checklist-progress">
                  {' '}({checklistDone}/{checklistItems.length})
                </span>
              )}
            </h2>
            {checklistItems.length > 0 && (
              <div className="checklist-progress-bar">
                <div
                  className="checklist-progress-fill"
                  style={{
                    width: `${checklistItems.length > 0 ? (checklistDone / checklistItems.length) * 100 : 0}%`,
                  }}
                />
              </div>
            )}
            <ul className="checklist-list">
              {checklistItems.map((item) => (
                <li key={item.id} className="checklist-item">
                  <button
                    type="button"
                    className={`checklist-checkbox ${item.concluido ? 'checked' : ''}`}
                    onClick={() => toggleChecklistItem.mutate(item.id)}
                    aria-label={`${item.concluido ? 'Desmarcar' : 'Marcar'} "${item.texto}"`}
                  >
                    {item.concluido ? '✓' : ''}
                  </button>
                  <button
                    type="button"
                    className={`checklist-text-btn ${item.concluido ? 'done' : ''}`}
                    onClick={() => setSelectedSubtask(item)}
                    title="Clique para abrir detalhes"
                  >
                    {item.texto}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => deleteChecklistItem.mutate(item.id)}
                    aria-label={`Remover "${item.texto}"`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddCheckItem} className="form-inline" style={{ marginTop: 8 }}>
              <input
                className="input"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Nova subtarefa..."
                aria-label="Nova subtarefa"
              />
              <button type="submit" className="btn btn-secondary" disabled={addChecklistItem.isPending}>
                +
              </button>
            </form>
          </section>

          {/* Comments */}
          <section className="card-detail-section">
            <h2 className="section-title">💬 Comentários ({comments.length})</h2>
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                className="input comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                rows={3}
              />
              <button type="submit" className="btn btn-primary" disabled={addComment.isPending}>
                {addComment.isPending ? 'Enviando…' : 'Comentar'}
              </button>
            </form>
            <ul className="comment-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{c.autor}</span>
                    <span className="comment-date">
                      {new Date(c.createdAt).toLocaleString('pt-BR')}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => deleteComment.mutate(c.id)}
                      aria-label="Excluir comentário"
                    >
                      ×
                    </button>
                  </div>
                  <div className="comment-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.texto}</ReactMarkdown>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* AI Sidebar */}
        {showAi && (
          <aside className="card-detail-ai">
            <h2 className="section-title">🤖 Assistente IA</h2>
            <div className="ai-actions">
              <button type="button" className="btn btn-secondary" onClick={() => handleAi('summarize')} disabled={aiAction.isPending}>
                📝 Resumir
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleAi('subtasks')} disabled={aiAction.isPending}>
                📋 Subtarefas
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleAi('clarify')} disabled={aiAction.isPending}>
                ❓ Esclarecer
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => handleAi('risk')} disabled={aiAction.isPending}>
                ⚠️ Riscos
              </button>
            </div>
            {aiAction.isPending && (
              <p className="loading-text">Processando com IA…</p>
            )}
            {aiResult && (
              <div className="ai-result">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Subtask Modal */}
      {selectedSubtask && (
        <SubtaskModal
          item={selectedSubtask}
          onClose={() => setSelectedSubtask(null)}
          onToggle={(id) => toggleChecklistItem.mutate(id)}
          onDelete={(id) => deleteChecklistItem.mutate(id)}
        />
      )}
    </div>
  )
}
