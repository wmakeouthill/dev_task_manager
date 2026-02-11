import { api } from '@/lib/axios'
import type { ReminderData, PagedResponse } from '@/shared/types'

export const reminderApi = {
    listar: (page = 1, size = 50) =>
        api
            .get<PagedResponse<ReminderData>>('/reminders', { params: { page, size } })
            .then((r) => r.data),

    criar: (data: {
        titulo: string
        scheduleAt: string
        cardId?: string
        descricao?: string
        recurrence?: string
        recurrenceDays?: number
    }) =>
        api.post<ReminderData>('/reminders', data).then((r) => r.data),

    snooze: (id: string, until: string) =>
        api.patch<ReminderData>(`/reminders/${id}/snooze`, { until }).then((r) => r.data),

    cancelar: (id: string) => api.delete(`/reminders/${id}`),
}
