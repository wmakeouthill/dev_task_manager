import { useState } from 'react'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import type { AiSuggestion } from '@/shared/types'

interface AiSuggestionCardProps {
    suggestion: AiSuggestion
    onAccept: () => void
    onReject: () => void
    /** Aceita uma subtarefa individual (adicionada ao checklist) */
    onAcceptSingleSubtask?: (item: string) => void
    isPending?: boolean
}

/**
 * Card de sugestão da IA exibido inline no chat.
 * Subtarefas são numeradas e podem ser aceitas/rejeitadas individualmente.
 */
export function AiSuggestionCard({ suggestion, onAccept, onReject, onAcceptSingleSubtask, isPending }: Readonly<AiSuggestionCardProps>) {
    const [handledItems, setHandledItems] = useState<Set<number>>(new Set())

    const typeLabel = suggestion.type === 'description'
        ? '📝 Descrição sugerida'
        : suggestion.type === 'subtasks'
            ? '☑️ Subtarefas sugeridas'
            : '💡 Sugestão'

    const isSubtasks = suggestion.type === 'subtasks' && !!suggestion.subtaskItems?.length
    const remainingCount = isSubtasks
        ? suggestion.subtaskItems!.length - handledItems.size
        : 0

    const handleAcceptItem = (index: number, item: string) => {
        onAcceptSingleSubtask?.(item)
        const next = new Set(handledItems)
        next.add(index)
        setHandledItems(next)
        if (suggestion.subtaskItems && next.size >= suggestion.subtaskItems.length) {
            onReject()
        }
    }

    const handleRejectItem = (index: number) => {
        const next = new Set(handledItems)
        next.add(index)
        setHandledItems(next)
        if (suggestion.subtaskItems && next.size >= suggestion.subtaskItems.length) {
            onReject()
        }
    }

    return (
        <div className="ai-suggestion-card">
            <div className="ai-suggestion-card-header">
                <span className="ai-suggestion-card-type">{typeLabel}</span>
                {isSubtasks && (
                    <span className="ai-suggestion-card-count">
                        {remainingCount}/{suggestion.subtaskItems!.length}
                    </span>
                )}
            </div>

            <div className="ai-suggestion-card-preview">
                {isSubtasks ? (
                    <ul className="ai-suggestion-subtask-list">
                        {suggestion.subtaskItems!.map((item, i) => (
                            <li
                                key={i}
                                className={`ai-suggestion-subtask-item${handledItems.has(i) ? ' ai-suggestion-subtask-item--handled' : ''}`}
                            >
                                <span className="ai-suggestion-subtask-number">{i + 1}.</span>
                                <span className="ai-suggestion-subtask-text card-detail-markdown">
                                    <MarkdownWithCode>{item}</MarkdownWithCode>
                                </span>
                                {!handledItems.has(i) && (
                                    <span className="ai-suggestion-subtask-actions">
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-xs"
                                            onClick={() => handleAcceptItem(i, item)}
                                            disabled={isPending}
                                            title="Aceitar subtarefa"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => handleRejectItem(i)}
                                            disabled={isPending}
                                            title="Rejeitar subtarefa"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <MarkdownWithCode>{suggestion.content}</MarkdownWithCode>
                )}
            </div>

            <div className="ai-suggestion-card-actions">
                {isSubtasks ? (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={onReject}
                        disabled={isPending}
                    >
                        ✕ Rejeitar sugestão
                    </button>
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </div>
    )
}
