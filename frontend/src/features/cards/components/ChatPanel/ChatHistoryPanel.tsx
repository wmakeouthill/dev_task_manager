import type { ChatConversation } from '@/shared/services/chatStorageService'

interface ChatHistoryPanelProps {
    conversations: ChatConversation[]
    activeId: string | null
    onSelect: (id: string) => void
    onDelete: (id: string) => void
    onClose: () => void
}

/**
 * Painel lateral de histórico de conversas.
 * Exibe lista de conversas anteriores do card com opções de abrir/deletar.
 */
export function ChatHistoryPanel({ conversations, activeId, onSelect, onDelete, onClose }: ChatHistoryPanelProps) {
    return (
        <div className="chat-history-panel">
            <div className="chat-history-panel-header">
                <h3 className="chat-history-panel-title">Histórico</h3>
                <button
                    type="button"
                    className="chat-history-panel-close"
                    onClick={onClose}
                    aria-label="Fechar histórico"
                >
                    ×
                </button>
            </div>
            <div className="chat-history-panel-list">
                {conversations.length === 0 ? (
                    <p className="chat-history-panel-empty">Nenhuma conversa anterior.</p>
                ) : (
                    conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`chat-history-item ${conv.id === activeId ? 'active' : ''}`}
                        >
                            <button
                                type="button"
                                className="chat-history-item-btn"
                                onClick={() => onSelect(conv.id)}
                                title={conv.title}
                            >
                                <span className="chat-history-item-title">{conv.title}</span>
                                <span className="chat-history-item-meta">
                                    {conv.messages.length} msg · {new Date(conv.updatedAt).toLocaleDateString('pt-BR')}
                                </span>
                            </button>
                            <button
                                type="button"
                                className="chat-history-item-delete"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(conv.id)
                                }}
                                aria-label={`Excluir conversa "${conv.title}"`}
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
