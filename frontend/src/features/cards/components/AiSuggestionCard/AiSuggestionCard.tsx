import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import type { AiSuggestion } from '@/shared/types'

interface AiSuggestionCardProps {
    suggestion: AiSuggestion
    onAccept: () => void
    onReject: () => void
    isPending?: boolean
}

/**
 * Card de sugestão da IA exibido inline no chat.
 * Mostra preview do conteúdo formatado e botões Aceitar/Rejeitar.
 */
export function AiSuggestionCard({ suggestion, onAccept, onReject, isPending }: AiSuggestionCardProps) {
    const typeLabel = suggestion.type === 'description'
        ? '📝 Descrição sugerida'
        : suggestion.type === 'subtasks'
            ? '☑️ Subtarefas sugeridas'
            : '💡 Sugestão'

    return (
        <div className="ai-suggestion-card">
            <div className="ai-suggestion-card-header">
                <span className="ai-suggestion-card-type">{typeLabel}</span>
            </div>

            <div className="ai-suggestion-card-preview">
                {suggestion.type === 'subtasks' && suggestion.subtaskItems?.length ? (
                    <ul className="ai-suggestion-subtask-list">
                        {suggestion.subtaskItems.map((item, i) => (
                            <li key={i} className="ai-suggestion-subtask-item">
                                <span className="ai-suggestion-subtask-checkbox">☐</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <MarkdownWithCode>{suggestion.content}</MarkdownWithCode>
                )}
            </div>

            <div className="ai-suggestion-card-actions">
                <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={onAccept}
                    disabled={isPending}
                >
                    ✓ Aceitar
                </button>
                <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={onReject}
                    disabled={isPending}
                >
                    ✕ Rejeitar
                </button>
            </div>
        </div>
    )
}
