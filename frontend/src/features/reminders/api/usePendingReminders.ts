import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import type { ReminderData } from '@/shared/types'

async function fetchPendingReminders(): Promise<ReminderData[]> {
    const { data } = await api.get<ReminderData[]>('/reminders/pending')
    return data
}

/**
 * Hook que faz polling dos lembretes pendentes a cada 30s.
 * Usado pelo ReminderNotificationManager para disparar notificações nativas.
 */
export function usePendingReminders() {
    return useQuery({
        queryKey: ['reminders', 'pending'],
        queryFn: fetchPendingReminders,
        refetchInterval: 30_000,
        refetchIntervalInBackground: true,
    })
}
