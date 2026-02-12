import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import { useAiChat } from '@/features/ai'
import { AiSuggestionCard } from '@/features/cards/components/AiSuggestionCard'
import { CardReferenceMenu } from '@/features/cards/components/CardReferenceMenu'
import { ChatHistoryPanel } from './ChatHistoryPanel'
import {
    listConversations,
    getConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    generateTitle,
    type PersistedChatMessage,
    type ChatConversation,
} from '@/shared/services/chatStorageService'
import type { AiChatMessage, AiSuggestion, CardSearchResult } from '@/shared/types'

type ChatMessage = PersistedChatMessage

/** Sugestão pendente com referência ao msgId para remoção */
export interface PendingSuggestion {
    msgId: string
    suggestionIndex: number
    suggestion: AiSuggestion
}

interface ChatPanelProps {
    cardId: string
    onAcceptDescription: (markdown: string) => void
    onAcceptSubtasks: (items: string[]) => void
    /** Chamado sempre que as sugestões pendentes mudam (para preview inline) */
    onPendingSuggestionsChange?: (suggestions: PendingSuggestion[]) => void
}

/** Handle exposto via ref para o componente pai */
export interface ChatPanelHandle {
    /** Remove uma sugestão do chat (chamado pelo pai ao aceitar/rejeitar no preview inline) */
    dismissSuggestion: (msgId: string, suggestionIndex: number) => void
}

/**
 * Painel de chat IA com persistência de conversas em localStorage.
 * Botões de "nova conversa" e "histórico" no header (estilo Cursor).
 */
export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(function ChatPanel(
    { cardId, onAcceptDescription, onAcceptSubtasks, onPendingSuggestionsChange },
    ref
) {
    const aiChat = useAiChat()

    // Conversa atual
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [conversations, setConversations] = useState<ChatConversation[]>([])
    const [showHistory, setShowHistory] = useState(false)

    const [chatInput, setChatInput] = useState('')
    const [referencedCardIds, setReferencedCardIds] = useState<string[]>([])
    const [referencedCards, setReferencedCards] = useState<CardSearchResult[]>([])
    const chatMessagesEndRef = useRef<HTMLDivElement>(null)
    const chatTextareaRef = useRef<HTMLTextAreaElement>(null)

    // Slash command state
    const [showSlashMenu, setShowSlashMenu] = useState(false)
    const [slashSearch, setSlashSearch] = useState('')
    const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 })

    /** Função interna para remover uma sugestão pelo msgId + index */
    const removeSuggestion = useCallback((msgId: string, suggestionIndex: number) => {
        setChatMessages((prev) =>
            prev.map((m) => {
                if (m.id !== msgId || !m.suggestions) return m
                const updated = m.suggestions.filter((_, i) => i !== suggestionIndex)
                return { ...m, suggestions: updated.length > 0 ? updated : undefined }
            })
        )
    }, [])

    // Expor handle para o pai
    useImperativeHandle(ref, () => ({
        dismissSuggestion: removeSuggestion,
    }), [removeSuggestion])

    // Carregar ou criar conversa ao montar / trocar cardId
    useEffect(() => {
        const existing = listConversations(cardId)
        setConversations(existing)
        if (existing.length > 0) {
            // Carrega a mais recente
            setConversationId(existing[0].id)
            setChatMessages(existing[0].messages)
        } else {
            // Cria nova conversa
            const conv = createConversation(cardId)
            setConversationId(conv.id)
            setChatMessages([])
            setConversations([conv])
        }
    }, [cardId])

    const resizeTextarea = (el: HTMLTextAreaElement | null) => {
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${Math.max(36, Math.min(el.scrollHeight, 200))}px`
    }

    useEffect(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    // Persistir mensagens no localStorage sempre que mudarem
    useEffect(() => {
        if (!conversationId || chatMessages.length === 0) return
        const title = generateTitle(chatMessages)
        updateConversation(conversationId, chatMessages, title)
        setConversations(listConversations(cardId))
    }, [chatMessages, conversationId, cardId])

    // Propagar sugestões pendentes para o componente pai (preview inline)
    useEffect(() => {
        if (!onPendingSuggestionsChange) return
        const pending: PendingSuggestion[] = []
        for (const msg of chatMessages) {
            if (msg.suggestions) {
                msg.suggestions.forEach((suggestion, idx) => {
                    pending.push({ msgId: msg.id, suggestionIndex: idx, suggestion })
                })
            }
        }
        onPendingSuggestionsChange(pending)
    }, [chatMessages, onPendingSuggestionsChange])

    useEffect(() => {
        resizeTextarea(chatTextareaRef.current)
    }, [chatInput])

    /** Extrai histórico no formato esperado pela API */
    const buildHistory = useCallback((): AiChatMessage[] => {
        return chatMessages.map((m) => ({ role: m.role, content: m.content }))
    }, [chatMessages])

    /** Envia mensagem para a IA */
    const handleSend = useCallback((text: string) => {
        if (!text.trim()) return

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text.trim(),
        }
        setChatMessages((prev) => [...prev, userMsg])
        setChatInput('')
        resizeTextarea(chatTextareaRef.current)

        const history = buildHistory()

        aiChat.mutate(
            {
                cardId,
                message: text.trim(),
                history,
                referencedCardIds: referencedCardIds.length > 0 ? referencedCardIds : undefined,
            },
            {
                onSuccess: (response) => {
                    const assistantMsg: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: response.reply,
                        suggestions: response.suggestions?.length ? response.suggestions : undefined,
                    }
                    setChatMessages((prev) => [...prev, assistantMsg])
                },
                onError: (error) => {
                    const errorMsg: ChatMessage = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: `❌ Erro: ${error instanceof Error ? error.message : 'Falha ao conectar com a IA'}`,
                    }
                    setChatMessages((prev) => [...prev, errorMsg])
                },
            }
        )
    }, [cardId, buildHistory, referencedCardIds, aiChat])

    /** Ação rápida (quick action buttons) */
    const handleQuickAction = (action: string) => {
        const labels: Record<string, string> = {
            summarize: 'Resuma este card',
            subtasks: 'Sugira subtarefas para este card',
            clarify: 'O que precisa ser esclarecido neste card?',
            risk: 'Quais os riscos deste card?',
        }
        handleSend(labels[action] ?? action)
    }

    /** Aceitar uma sugestão específica pelo índice */
    const handleAcceptSuggestion = (msg: ChatMessage, suggestionIndex: number) => {
        const suggestion = msg.suggestions?.[suggestionIndex]
        if (!suggestion) return
        if (suggestion.type === 'description') {
            onAcceptDescription(suggestion.content)
        } else if (suggestion.type === 'subtasks' && suggestion.subtaskItems?.length) {
            onAcceptSubtasks(suggestion.subtaskItems)
        }
        removeSuggestion(msg.id, suggestionIndex)
    }

    /** Rejeitar uma sugestão específica pelo índice */
    const handleRejectSuggestion = (msgId: string, suggestionIndex: number) => {
        removeSuggestion(msgId, suggestionIndex)
    }

    /** Iniciar nova conversa */
    const handleNewConversation = () => {
        const conv = createConversation(cardId)
        setConversationId(conv.id)
        setChatMessages([])
        setReferencedCardIds([])
        setReferencedCards([])
        setConversations(listConversations(cardId))
        setShowHistory(false)
        chatTextareaRef.current?.focus()
    }

    /** Carregar conversa do histórico */
    const handleLoadConversation = (id: string) => {
        const conv = getConversation(id)
        if (!conv) return
        setConversationId(conv.id)
        setChatMessages(conv.messages)
        setReferencedCardIds([])
        setReferencedCards([])
        setShowHistory(false)
    }

    /** Deletar conversa do histórico */
    const handleDeleteConversation = (id: string) => {
        deleteConversation(id)
        const updated = listConversations(cardId)
        setConversations(updated)
        // Se deletou a conversa ativa, cria nova
        if (id === conversationId) {
            if (updated.length > 0) {
                setConversationId(updated[0].id)
                setChatMessages(updated[0].messages)
            } else {
                handleNewConversation()
            }
        }
    }

    /** Selecionar card via slash command */
    const handleSelectCardRef = (card: CardSearchResult) => {
        setShowSlashMenu(false)
        // Adiciona referência
        if (!referencedCardIds.includes(card.id)) {
            setReferencedCardIds((prev) => [...prev, card.id])
            setReferencedCards((prev) => [...prev, card])
        }
        // Remove o /search do input
        const slashIdx = chatInput.lastIndexOf('/')
        const before = slashIdx >= 0 ? chatInput.substring(0, slashIdx) : chatInput
        setChatInput(before)
        chatTextareaRef.current?.focus()
    }

    const handleRemoveRef = (id: string) => {
        setReferencedCardIds((prev) => prev.filter((x) => x !== id))
        setReferencedCards((prev) => prev.filter((x) => x.id !== id))
    }

    /** Detecta '/' no input */
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setChatInput(val)

        const slashIdx = val.lastIndexOf('/')
        if (slashIdx >= 0) {
            const after = val.substring(slashIdx + 1)
            // Se não tem espaço no texto após /, mostra menu
            if (!after.includes(' ') && after.length <= 30) {
                setSlashSearch(after)
                // Posiciona acima do textarea
                const textarea = chatTextareaRef.current
                if (textarea) {
                    const rect = textarea.getBoundingClientRect()
                    setSlashMenuPos({ top: rect.top - 8, left: rect.left })
                }
                setShowSlashMenu(true)
                return
            }
        }
        setShowSlashMenu(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showSlashMenu) return // CardReferenceMenu handles keyboard
        if (e.key === 'Enter' && !e.ctrlKey) {
            e.preventDefault()
            handleSend(chatInput)
        }
    }

    return (
        <>
            <div className="card-detail-ai-chat-header">
                <h2 className="section-title">🤖 Chat IA</h2>
                <div className="chat-header-actions">
                    <button
                        type="button"
                        className="chat-header-btn"
                        onClick={handleNewConversation}
                        title="Nova conversa"
                        aria-label="Nova conversa"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`chat-header-btn ${showHistory ? 'active' : ''}`}
                        onClick={() => setShowHistory(!showHistory)}
                        title="Histórico de conversas"
                        aria-label="Histórico de conversas"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>

            {showHistory ? (
                <ChatHistoryPanel
                    conversations={conversations}
                    activeId={conversationId}
                    onSelect={handleLoadConversation}
                    onDelete={handleDeleteConversation}
                    onClose={() => setShowHistory(false)}
                />
            ) : (
            <>
            <p className="card-detail-ai-chat-hint">
                Converse sobre o card, peça ajuda com descrição e subtarefas. Digite <kbd>/</kbd> para referenciar outro card.
            </p>

            <div className="card-detail-ai-chat-messages">
                {chatMessages.length === 0 && (
                    <>
                        <div className="card-detail-ai-quick-actions">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickAction('summarize')} disabled={aiChat.isPending}>
                                📝 Resumir
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickAction('subtasks')} disabled={aiChat.isPending}>
                                📋 Subtarefas
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickAction('clarify')} disabled={aiChat.isPending}>
                                ❓ Esclarecer
                            </button>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleQuickAction('risk')} disabled={aiChat.isPending}>
                                ⚠️ Riscos
                            </button>
                        </div>
                        <div className="card-detail-ai-chat-welcome">
                            <p>Ou digite abaixo para conversar com a IA sobre este card.</p>
                        </div>
                    </>
                )}

                {chatMessages.map((msg) => (
                    <div key={msg.id} className={`card-detail-ai-chat-msg card-detail-ai-chat-msg--${msg.role}`}>
                        <span className="card-detail-ai-chat-msg-role">{msg.role === 'user' ? 'Você' : 'IA'}</span>
                        <div className="card-detail-ai-chat-msg-content">
                            {msg.role === 'assistant' ? (
                                <MarkdownWithCode>{msg.content}</MarkdownWithCode>
                            ) : (
                                <p>{msg.content}</p>
                            )}
                        </div>
                        {msg.suggestions && msg.suggestions.length > 0 && msg.suggestions.map((suggestion, idx) => (
                            <AiSuggestionCard
                                key={`${msg.id}-suggestion-${idx}`}
                                suggestion={suggestion}
                                onAccept={() => handleAcceptSuggestion(msg, idx)}
                                onReject={() => handleRejectSuggestion(msg.id, idx)}
                            />
                        ))}
                    </div>
                ))}

                {aiChat.isPending && (
                    <div className="card-detail-ai-chat-msg card-detail-ai-chat-msg--assistant">
                        <span className="card-detail-ai-chat-msg-role">IA</span>
                        <div className="card-detail-ai-chat-msg-content">
                            <p className="ai-typing">Pensando…</p>
                        </div>
                    </div>
                )}

                <div ref={chatMessagesEndRef} />
            </div>

            {/* Cards referenciados */}
            {referencedCards.length > 0 && (
                <div className="card-detail-ai-refs">
                    <span className="card-detail-ai-refs-label">🔗 Contexto:</span>
                    {referencedCards.map((c) => (
                        <span key={c.id} className="card-detail-ai-ref-tag">
                            {c.titulo}
                            <button type="button" onClick={() => handleRemoveRef(c.id)} className="card-detail-ai-ref-remove" aria-label={`Remover referência ${c.titulo}`}>×</button>
                        </span>
                    ))}
                </div>
            )}

            <form
                className="card-detail-ai-chat-form"
                onSubmit={(e) => {
                    e.preventDefault()
                    handleSend(chatInput)
                }}
            >
                <div className="chat-input-wrap" style={{ position: 'relative' }}>
                    <textarea
                        ref={chatTextareaRef}
                        className="input card-detail-ai-chat-input"
                        value={chatInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Mensagem para a IA… (/ para referenciar card)"
                        rows={1}
                        aria-label="Mensagem do chat"
                    />
                    {showSlashMenu && (
                        <CardReferenceMenu
                            searchText={slashSearch}
                            position={slashMenuPos}
                            onSelect={handleSelectCardRef}
                            onClose={() => setShowSlashMenu(false)}
                        />
                    )}
                </div>
                <button type="submit" className="btn btn-primary card-detail-ai-chat-send" disabled={!chatInput.trim() || aiChat.isPending}>
                    {aiChat.isPending ? '…' : 'Enviar'}
                </button>
            </form>
            </>
            )}
        </>
    )
})
