import { useEffect, useRef, useState, useCallback } from 'react'
import { usePendingReminders } from '@/features/reminders/api/usePendingReminders'
import { useSnoozeReminder, useCancelReminder } from '@/features/reminders/api/useReminders'
import { notificationService } from '@/shared/services/notificationService'
import { ReminderToast } from '@/shared/components/ReminderToast'
import type { ReminderData } from '@/shared/types'

/**
 * Componente global montado no App root.
 * Poll /reminders/pending a cada 30s, dispara notificações nativas do Windows
 * e exibe toasts in-app com opções de snooze (5/10/20/30 min).
 */
export function ReminderNotificationManager() {
    const { data: pending = [] } = usePendingReminders()
    const snooze = useSnoozeReminder()
    const cancel = useCancelReminder()

    // IDs já notificados para não repetir
    const notifiedRef = useRef<Set<string>>(new Set())
    // Toasts visíveis in-app
    const [toasts, setToasts] = useState<ReminderData[]>([])

    // Pede permissão de notificação no mount
    useEffect(() => {
        if (notificationService.isSupported && notificationService.permission === 'default') {
            notificationService.requestPermission()
        }
    }, [])

    // Quando pending muda, notifica novos lembretes
    useEffect(() => {
        for (const rem of pending) {
            if (notifiedRef.current.has(rem.id)) continue
            notifiedRef.current.add(rem.id)

            // Notificação nativa do Windows
            notificationService.send(`🔔 ${rem.titulo}`, {
                body: rem.descricao ?? 'Lembrete pendente',
                tag: `reminder-${rem.id}`,
                requireInteraction: true,
                onClick: () => window.focus(),
            })

            // Toast in-app
            setToasts((prev) => {
                if (prev.some((t) => t.id === rem.id)) return prev
                return [...prev, rem]
            })
        }

        // Limpa IDs que não estão mais pendentes
        const pendingIds = new Set(pending.map((r) => r.id))
        for (const id of notifiedRef.current) {
            if (!pendingIds.has(id)) {
                notifiedRef.current.delete(id)
            }
        }
    }, [pending])

    const handleSnooze = useCallback((id: string, minutes: number) => {
        const until = new Date(Date.now() + minutes * 60_000).toISOString()
        snooze.mutate({ id, until })
        setToasts((prev) => prev.filter((t) => t.id !== id))
        notifiedRef.current.delete(id)
    }, [snooze])

    const handleDismiss = useCallback((id: string) => {
        cancel.mutate(id)
        setToasts((prev) => prev.filter((t) => t.id !== id))
        notifiedRef.current.delete(id)
    }, [cancel])

    if (toasts.length === 0) return null

    return (
        <div className="reminder-toast-container" aria-live="polite">
            {toasts.map((rem) => (
                <ReminderToast
                    key={rem.id}
                    reminder={rem}
                    onSnooze={(min) => handleSnooze(rem.id, min)}
                    onDismiss={() => handleDismiss(rem.id)}
                />
            ))}
        </div>
    )
}
