import { useState, useRef, useEffect, useMemo } from 'react'
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
import { SlashCommandMenu, SLASH_COMMANDS, filterSlashCommands } from '@/features/cards/components/SlashCommandMenu'
import { getCaretCoordinates } from '@/features/cards/components/SlashCommandMenu/getCaretCoordinates'
import type { ChecklistItemData } from '@/shared/types'
import type { SlashCommand } from '@/features/cards/components/SlashCommandMenu'

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
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const chatPanelRef = useRef<HTMLElement>(null)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedSubtask, setSelectedSubtask] = useState<ChecklistItemData | null>(null)
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [dueDateInput, setDueDateInput] = useState('')
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashStart, setSlashStart] = useState(0)
  const [slashFilter, setSlashFilter] = useState('')
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0)
  const [slashCursorPos, setSlashCursorPos] = useState(0)
  const [slashPosition, setSlashPosition] = useState<{ top: number; left: number } | null>(null)
  const descTextareaRef = useRef<HTMLTextAreaElement>(null)
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null)
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingCursorRef = useRef<number | null>(null)

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(36, Math.min(el.scrollHeight, 200))}px`
  }

  const filteredSlashCommands = useMemo(
    () => filterSlashCommands(SLASH_COMMANDS, slashFilter),
    [slashFilter]
  )

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    resizeTextarea(commentTextareaRef.current)
  }, [newComment])

  useEffect(() => {
    resizeTextarea(chatTextareaRef.current)
  }, [chatInput])

  useEffect(() => {
    const ta = descTextareaRef.current
    if (ta && pendingCursorRef.current !== null) {
      const pos = pendingCursorRef.current
      ta.focus()
      ta.setSelectionRange(pos, pos)
      pendingCursorRef.current = null
    }
  }, [descInput])


  useEffect(() => {
    if (!slashOpen || !descTextareaRef.current) {
      setSlashPosition(null)
      return
    }
    const ta = descTextareaRef.current
    const pos = slashCursorPos
    const raf = requestAnimationFrame(() => {
      try {
        const coords = getCaretCoordinates(ta, pos)
        setSlashPosition(coords)
      } catch {
        setSlashPosition(null)
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [slashOpen, slashCursorPos, descInput])

  const applySlashCommand = (cmd: SlashCommand, selectionStart: number) => {
    const before = descInput.slice(0, slashStart)
    const after = descInput.slice(selectionStart)
    const insert = cmd.prefix + cmd.suffix
    const newValue = before + insert + after
    setDescInput(newValue)
    const newCursor = cmd.cursorAfterPrefix
      ? slashStart + cmd.prefix.length
      : slashStart + insert.length
    pendingCursorRef.current = newCursor
    setSlashOpen(false)
  }

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const pos = e.target.selectionStart ?? 0
    setDescInput(value)
    if (slashOpen) {
      if (value[slashStart] !== '/') {
        setSlashOpen(false)
      } else {
        setSlashFilter(value.slice(slashStart + 1, pos))
        setSlashCursorPos(pos)
      }
    } else {
      if (pos > 0 && value[pos - 1] === '/') {
        setSlashStart(pos - 1)
        setSlashFilter('')
        setSlashSelectedIndex(0)
        setSlashCursorPos(pos)
        setSlashOpen(true)
      }
    }
  }

  const handleDescKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashOpen) return
    const count = filteredSlashCommands.length
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSlashSelectedIndex((i) => (i + 1) % Math.max(1, count))
        return
      case 'ArrowUp':
        e.preventDefault()
        setSlashSelectedIndex((i) => (i - 1 + count) % Math.max(1, count))
        return
      case 'Enter':
        e.preventDefault()
        if (count > 0) {
          applySlashCommand(filteredSlashCommands[slashSelectedIndex], e.currentTarget.selectionStart ?? slashStart + 1 + slashFilter.length)
        }
        return
      case 'Escape':
        e.preventDefault()
        setSlashOpen(false)
        return
    }
  }

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
    aiAction.mutate({ action, cardId: card.id })
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
    <div className="card-detail-page">
      <div className="card-detail-layout">
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
              <div className="card-detail-desc-edit">
                <textarea
                  ref={descTextareaRef}
                  className="input card-detail-textarea"
                  value={descInput}
                  onChange={handleDescChange}
                  onKeyDown={handleDescKeyDown}
                  rows={12}
                  placeholder="Escreva em Markdown... Digite / para comandos de formatação"
                  autoFocus
                />
                {slashOpen && (
                  <SlashCommandMenu
                    open={slashOpen}
                    filteredCommands={filteredSlashCommands}
                    selectedIndex={filteredSlashCommands.length === 0 ? 0 : Math.min(slashSelectedIndex, filteredSlashCommands.length - 1)}
                    onSelectIndex={setSlashSelectedIndex}
                    onSelect={(cmd) => applySlashCommand(cmd, descTextareaRef.current?.selectionStart ?? slashStart + 1 + slashFilter.length)}
                    onClose={() => setSlashOpen(false)}
                    position={slashPosition}
                  />
                )}
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.texto}</ReactMarkdown>
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

        {/* Chat à direita - preenche a altura */}
        <aside ref={chatPanelRef} className="card-detail-ai card-detail-ai-chat">
          <div className="card-detail-ai-chat-header">
            <h2 className="section-title">🤖 Chat IA</h2>
            <p className="card-detail-ai-chat-hint">Converse sobre o card, peça ajuda com descrição e subtarefas.</p>
          </div>
          <div className="card-detail-ai-chat-messages">
            {chatMessages.length === 0 && (
              <>
                <div className="card-detail-ai-quick-actions">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAi('summarize')} disabled={aiAction.isPending}>
                    📝 Resumir
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAi('subtasks')} disabled={aiAction.isPending}>
                    📋 Subtarefas
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAi('clarify')} disabled={aiAction.isPending}>
                    ❓ Esclarecer
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAi('risk')} disabled={aiAction.isPending}>
                    ⚠️ Riscos
                  </button>
                </div>
                <div className="card-detail-ai-chat-welcome">
                  <p>Ou digite abaixo para conversar. (Backend em desenvolvimento.)</p>
                </div>
              </>
            )}
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`card-detail-ai-chat-msg card-detail-ai-chat-msg--${msg.role}`}>
                <span className="card-detail-ai-chat-msg-role">{msg.role === 'user' ? 'Você' : 'IA'}</span>
                <div className="card-detail-ai-chat-msg-content">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatMessagesEndRef} />
          </div>
          <form
            className="card-detail-ai-chat-form"
            onSubmit={(e) => {
              e.preventDefault()
              const text = chatInput.trim()
              if (!text) return
              setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: text }])
              setChatInput('')
              resizeTextarea(chatTextareaRef.current)
            }}
          >
            <div className="chat-input-wrap">
              <textarea
                ref={chatTextareaRef}
                className="input card-detail-ai-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.ctrlKey) {
                    e.preventDefault()
                    if (chatInput.trim()) {
                      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: chatInput.trim() }])
                      setChatInput('')
                      resizeTextarea(chatTextareaRef.current)
                    }
                  }
                }}
                placeholder="Mensagem para a IA…"
                rows={1}
                aria-label="Mensagem do chat"
              />
            </div>
            <button type="submit" className="btn btn-primary card-detail-ai-chat-send" disabled={!chatInput.trim()}>
              Enviar
            </button>
          </form>
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
