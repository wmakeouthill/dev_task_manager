import { api } from '@/lib/axios'
import type { PersistedInsight, SaveInsightsRequest } from '@/shared/types'

export const insightsApi = {
    list: async () => {
        const { data } = await api.get<PersistedInsight[]>('/insights')
        return data
    },

    save: async (request: SaveInsightsRequest) => {
        const { data } = await api.post<PersistedInsight[]>('/insights', request)
        return data
    },

    remove: async (id: string) => {
        await api.delete(`/insights/${id}`)
    },

    removeAll: async () => {
        await api.delete('/insights')
    },
}
