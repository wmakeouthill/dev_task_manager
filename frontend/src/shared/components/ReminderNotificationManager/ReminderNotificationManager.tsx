import { useEffect, useRef, useState, useCallback } from 'react'
import { usePendingReminders } from '@/features/reminders/api/usePendingReminders'
import { useSnoozeReminder, useCancelReminder, useCompleteReminder } from '@/features/reminders/api/useReminders'
import { notificationService } from '@/shared/services/notificationService'
import { ReminderToast } from '@/shared/components/ReminderToast'
import { readSettings } from '@/features/settings/hooks/useSettings'
import type { ReminderData } from '@/shared/types'

/**
 * Componente global montado no App root.
 * Poll /reminders/pending a cada 30s, dispara notificações nativas do Windows
 * e exibe toasts in-app com opções de concluir, snooze e cancelar.
 */
export function ReminderNotificationManager() {
    const { data: pending = [] } = usePendingReminders()
    const snooze = useSnoozeReminder()
    const cancel = useCancelReminder()
    const complete = useCompleteReminder()

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
        const { notificationMode = 'both' } = readSettings()
        const showNative = notificationMode === 'native' || notificationMode === 'both'
        const showInApp = notificationMode === 'in-app' || notificationMode === 'both'

        for (const rem of pending) {
            if (notifiedRef.current.has(rem.id)) continue
            notifiedRef.current.add(rem.id)

            // Notificação nativa do Windows (se habilitada)
            if (showNative) {
                notificationService.send('Dev Task Manager', {
                    body: `🔔 ${rem.titulo}${rem.descricao ? `\n${rem.descricao}` : ''}`,
                    tag: `reminder-${rem.id}`,
                    requireInteraction: true,
                    onClick: () => globalThis.focus(),
                })
            }

            // Toast in-app (se habilitado)
            if (showInApp) {
                setToasts((prev) => {
                    if (prev.some((t) => t.id === rem.id)) return prev
                    return [...prev, rem]
                })
            }
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

    const handleComplete = useCallback((id: string) => {
        complete.mutate(id)
        setToasts((prev) => prev.filter((t) => t.id !== id))
        notifiedRef.current.delete(id)
    }, [complete])

    const handleDismiss = useCallback((id: string) => {
        cancel.mutate(id)
        setToasts((prev) => prev.filter((t) => t.id !== id))
        notifiedRef.current.delete(id)
    }, [cancel])

    const { toastPosition = 'top-right' } = readSettings()

    if (toasts.length === 0) return null

    return (
        <div className={`reminder-toast-container pos-${toastPosition}`} aria-live="polite">
            {toasts.map((rem) => (
                <ReminderToast
                    key={rem.id}
                    reminder={rem}
                    onSnooze={(min) => handleSnooze(rem.id, min)}
                    onComplete={() => handleComplete(rem.id)}
                    onDismiss={() => handleDismiss(rem.id)}
                />
            ))}
        </div>
    )
}
