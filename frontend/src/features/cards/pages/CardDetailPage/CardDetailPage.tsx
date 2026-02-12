import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import { useCard, useUpdateCard, useUpdateCardStatus, useDeleteCard } from '@/features/cards/api/useCardActions'
import {
  useComments, useAddComment, useDeleteComment,
  useChecklist, useAddChecklistItem, useToggleChecklistItem, useDeleteChecklistItem,
} from '@/features/cards/api/useCardExtras'
import { SubtaskModal } from '@/features/cards/components/SubtaskModal'
import { BlockNoteDescriptionEditor } from '@/features/cards/components/BlockNoteDescriptionEditor'
import { ChatPanel, type ChatPanelHandle, type PendingSuggestion } from '@/features/cards/components/ChatPanel'
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

  const [editingTitle, setEditingTitle] = useState(false)
  const [editingDesc, setEditingDesc] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newCheckItem, setNewCheckItem] = useState('')
  const chatPanelHandleRef = useRef<ChatPanelHandle>(null)
  const chatPanelRef = useRef<HTMLElement>(null)
  const layoutRef = useRef<HTMLDivElement>(null)

  // Sugestões pendentes vindas do chat (para preview inline)
  const [pendingSuggestions, setPendingSuggestions] = useState<PendingSuggestion[]>([])
  const pendingDescription = pendingSuggestions.find((s) => s.suggestion.type === 'description')
  const pendingSubtasks = pendingSuggestions.find((s) => s.suggestion.type === 'subtasks')

  const handlePendingSuggestionsChange = useCallback((suggestions: PendingSuggestion[]) => {
    setPendingSuggestions(suggestions)
  }, [])

  const CHAT_WIDTH_MIN = 280
  const CHAT_WIDTH_MAX = 560
  const CHAT_WIDTH_DEFAULT = 420
  const [chatWidth, setChatWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('card-detail-chat-width')
      if (saved) {
        const n = parseInt(saved, 10)
        if (n >= CHAT_WIDTH_MIN && n <= CHAT_WIDTH_MAX) return n
      }
    } catch {
      /* ignore */
    }
    return CHAT_WIDTH_DEFAULT
  })
  const [isResizingChat, setIsResizingChat] = useState(false)
  const resizeStartRef = useRef<{ x: number; w: number } | null>(null)
  const chatWidthRef = useRef(chatWidth)
  chatWidthRef.current = chatWidth
  const [selectedSubtask, setSelectedSubtask] = useState<ChecklistItemData | null>(null)
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [dueDateInput, setDueDateInput] = useState('')
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(36, Math.min(el.scrollHeight, 200))}px`
  }

  useEffect(() => {
    resizeTextarea(commentTextareaRef.current)
  }, [newComment])

  useEffect(() => {
    if (!isResizingChat) return
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    const onMove = (e: MouseEvent) => {
      const start = resizeStartRef.current
      if (!start) return
      const delta = start.x - e.clientX
      const next = Math.min(CHAT_WIDTH_MAX, Math.max(CHAT_WIDTH_MIN, start.w + delta))
      setChatWidth(next)
    }
    const onUp = () => {
      setIsResizingChat(false)
      resizeStartRef.current = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      try {
        localStorage.setItem('card-detail-chat-width', String(chatWidthRef.current))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isResizingChat])

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

  const handleSaveDesc = (markdown: string) => {
    updateCard.mutate({ id: card.id, data: { descricao: markdown } })
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

  const handleToggleAiEnabled = () => {
    updateCard.mutate({ id: card.id, data: { aiEnabled: !card.aiEnabled } })
  }

  const handleSaveDueDate = () => {
    const newDate = dueDateInput ? new Date(dueDateInput).toISOString() : null
    updateCard.mutate({ id: card.id, data: { dueDate: newDate } })
    setEditingDueDate(false)
  }

  /** Aceita sugestão de descrição vinda do ChatPanel */
  const handleAcceptDescription = (markdown: string) => {
    updateCard.mutate({ id: card.id, data: { descricao: markdown } })
  }

  /** Aceita sugestão de subtarefas vinda do ChatPanel */
  const handleAcceptSubtasks = (items: string[]) => {
    const currentLen = checklistItems.length
    items.forEach((texto, i) => {
      addChecklistItem.mutate({ texto, ordem: currentLen + i })
    })
  }

  /** Aceitar descrição sugerida inline (preview na seção de descrição) */
  const handleInlineAcceptDescription = () => {
    if (!pendingDescription) return
    handleAcceptDescription(pendingDescription.suggestion.content)
    chatPanelHandleRef.current?.dismissSuggestion(pendingDescription.msgId, pendingDescription.suggestionIndex)
  }

  /** Rejeitar descrição sugerida inline */
  const handleInlineRejectDescription = () => {
    if (!pendingDescription) return
    chatPanelHandleRef.current?.dismissSuggestion(pendingDescription.msgId, pendingDescription.suggestionIndex)
  }

  /** Aceitar subtarefas sugeridas inline (preview na seção de subtarefas) */
  const handleInlineAcceptSubtasks = () => {
    if (!pendingSubtasks?.suggestion.subtaskItems?.length) return
    handleAcceptSubtasks(pendingSubtasks.suggestion.subtaskItems)
    chatPanelHandleRef.current?.dismissSuggestion(pendingSubtasks.msgId, pendingSubtasks.suggestionIndex)
  }

  /** Rejeitar subtarefas sugeridas inline */
  const handleInlineRejectSubtasks = () => {
    if (!pendingSubtasks) return
    chatPanelHandleRef.current?.dismissSuggestion(pendingSubtasks.msgId, pendingSubtasks.suggestionIndex)
  }

  return (
    <div className="card-detail-page">
      <div
        ref={layoutRef}
        className="card-detail-layout"
        style={
          {
            '--chat-width': `${chatWidth}px`,
            '--chat-min': `${CHAT_WIDTH_MIN}px`,
            '--chat-max': `${CHAT_WIDTH_MAX}px`,
          } as React.CSSProperties
        }
      >
        {/* Coluna esquerda: header fixo + área do card com scroll */}
        <div className="card-detail-left">
          <header className="card-detail-header">
            <button
              type="button"
              className="card-detail-back-btn"
              onClick={() => navigate(-1)}
              aria-label="Voltar"
            >
              <span className="card-detail-back-icon" aria-hidden>←</span>
              Voltar
            </button>
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
            <button type="button" className="btn btn-ghost btn-danger" onClick={handleDelete}>
              🗑️
            </button>
          </header>

          {/* Bloco fixo: mesma linha = título (esq) | meta + toggle IA (dir) */}
          <div className="card-detail-main-top">
            <div className="card-detail-title-row">
              {/* Title */}
              {editingTitle ? (
                <div className="card-detail-title-edit card-detail-title-wrap">
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
                  className="card-detail-title card-detail-title-wrap"
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

              {/* Meta (inclui Insights IA) à direita do título */}
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
                <span className="card-detail-ai-toggle card-detail-ai-toggle--inline">
                  <button
                    type="button"
                    className={`btn btn-sm ${card.aiEnabled ? 'btn-ai-active' : 'btn-ghost'}`}
                    onClick={handleToggleAiEnabled}
                    title={card.aiEnabled
                      ? 'Dados deste card serão enviados para gerar insights'
                      : 'Este card não será usado para gerar insights (economiza tokens)'}
                    aria-label={card.aiEnabled ? 'Insights IA ativado (clique para desativar)' : 'Insights IA desativado (clique para ativar)'}
                  >
                    🤖 Insights IA: {card.aiEnabled ? 'On' : 'Off'}
                  </button>
                </span>
              </div>
            </div>
          </div>

          {/* Área com scroll: descrição, subtarefas, comentários */}
          <div className="card-detail-main-scroll">
          {/* Description (Markdown) */}
          <section className="card-detail-section">
            <h2 className="section-title">📝 Descrição</h2>
            {editingDesc ? (
              <BlockNoteDescriptionEditor
                initialMarkdown={card.descricao ?? ''}
                onSave={handleSaveDesc}
                onCancel={() => setEditingDesc(false)}
              />
            ) : (
              <div
                className="card-detail-markdown"
                onClick={() => setEditingDesc(true)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setEditingDesc(true)}
                role="button"
                tabIndex={0}
              >
                {card.descricao ? (
                  <MarkdownWithCode>{card.descricao}</MarkdownWithCode>
                ) : (
                  <p className="loading-text">Clique para adicionar descrição em Markdown... Digite / para formatação estilo Notion.</p>
                )}
              </div>
            )}

            {/* Preview inline da descrição sugerida pela IA */}
            {pendingDescription && !editingDesc && (
              <div className="ai-inline-preview ai-inline-preview--description">
                <div className="ai-inline-preview-header">
                  <span className="ai-inline-preview-label">🤖 Descrição sugerida pela IA</span>
                  <div className="ai-inline-preview-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleInlineAcceptDescription}>
                      ✓ Aceitar
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleInlineRejectDescription}>
                      ✕ Rejeitar
                    </button>
                  </div>
                </div>
                <div className="ai-inline-preview-content card-detail-markdown">
                  <MarkdownWithCode>{pendingDescription.suggestion.content}</MarkdownWithCode>
                </div>
              </div>
            )}
          </section>

          {/* Checklist / Subtasks */}
          <section className="card-detail-section">
            <h2 className="section-title">
              ☑️ Subtarefas
              {checklistItems.length > 0 && (
                <span className="checklist-count">
                  {' '}({checklistDone}/{checklistItems.length})
                </span>
              )}
            </h2>
            {checklistItems.length > 0 && (
              <div className="checklist-progress">
                <div
                  className="checklist-progress-bar"
                  style={{
                    width: `${(checklistDone / checklistItems.length) * 100}%`,
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

            {/* Preview inline das subtarefas sugeridas pela IA */}
            {pendingSubtasks && pendingSubtasks.suggestion.subtaskItems?.length && (
              <div className="ai-inline-preview ai-inline-preview--subtasks">
                <div className="ai-inline-preview-header">
                  <span className="ai-inline-preview-label">🤖 Subtarefas sugeridas pela IA</span>
                  <div className="ai-inline-preview-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleInlineAcceptSubtasks}>
                      ✓ Aceitar
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={handleInlineRejectSubtasks}>
                      ✕ Rejeitar
                    </button>
                  </div>
                </div>
                <ul className="ai-inline-subtask-list">
                  {pendingSubtasks.suggestion.subtaskItems.map((item, i) => (
                    <li key={i} className="ai-inline-subtask-item">
                      <span className="ai-inline-subtask-checkbox">☐</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Comments */}
          <section className="card-detail-section">
            <h2 className="section-title">💬 Comentários ({comments.length})</h2>
            <form onSubmit={handleAddComment} className="comment-form">
              <div className="comment-input-wrap">
                <textarea
                  ref={commentTextareaRef}
                  className="input comment-input"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.ctrlKey) {
                      e.preventDefault()
                      if (newComment.trim()) {
                        addComment.mutate(newComment.trim(), {
                          onSuccess: () => setNewComment(''),
                        })
                      }
                    }
                  }}
                  placeholder="Escreva um comentário..."
                  rows={1}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={addComment.isPending}>
                {addComment.isPending ? 'Enviando…' : 'Comentar'}
              </button>
            </form>
            <ul className="comment-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <span className="comment-author">{c.autor}</span>
                  <span className="comment-date">
                    {new Date(c.createdAt).toLocaleString('pt-BR')}
                  </span>
                  <span className="comment-sep"> : </span>
                  <span className="comment-body">
                    <MarkdownWithCode>{c.texto}</MarkdownWithCode>
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm comment-delete-btn"
                    onClick={() => deleteComment.mutate(c.id)}
                    aria-label="Excluir comentário"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </section>
          </div>
        </div>

        {/* Resize handle */}
        <div
          className={`card-detail-chat-resize-handle ${isResizingChat ? 'is-resizing' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizingChat(true)
            resizeStartRef.current = { x: e.clientX, w: chatWidth }
          }}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={chatWidth}
          aria-valuemin={CHAT_WIDTH_MIN}
          aria-valuemax={CHAT_WIDTH_MAX}
          aria-label="Redimensionar painel do chat"
        />

        {/* Chat à direita - preenche a altura */}
        <aside ref={chatPanelRef} className="card-detail-ai card-detail-ai-chat">
          <ChatPanel
            ref={chatPanelHandleRef}
            cardId={card.id}
            onAcceptDescription={handleAcceptDescription}
            onAcceptSubtasks={handleAcceptSubtasks}
            onPendingSuggestionsChange={handlePendingSuggestionsChange}
          />
        </aside>
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
