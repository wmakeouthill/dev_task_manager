import type { ReminderData } from '@/shared/types'

interface ReminderToastProps {
    reminder: ReminderData
    onSnooze: (minutes: number) => void
    onDismiss: () => void
}

const SNOOZE_OPTIONS = [5, 10, 20, 30] as const

/**
 * Toast in-app para lembrete pendente.
 * Exibe título, descrição e botões de snooze (5/10/20/30 min) + cancelar.
 */
export function ReminderToast({ reminder, onSnooze, onDismiss }: ReminderToastProps) {
    return (
        <div className="reminder-toast" role="alert" aria-live="assertive">
            <div className="reminder-toast-content">
                <div className="reminder-toast-icon">🔔</div>
                <div className="reminder-toast-text">
                    <strong className="reminder-toast-title">{reminder.titulo}</strong>
                    {reminder.descricao && (
                        <p className="reminder-toast-desc">{reminder.descricao}</p>
                    )}
                </div>
                <button
                    type="button"
                    className="reminder-toast-close"
                    onClick={onDismiss}
                    aria-label="Fechar notificação"
                >
                    ×
                </button>
            </div>
            <div className="reminder-toast-actions">
                {SNOOZE_OPTIONS.map((min) => (
                    <button
                        key={min}
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onSnooze(min)}
                    >
                        ⏰ {min}min
                    </button>
                ))}
                <button
                    type="button"
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={onDismiss}
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}
