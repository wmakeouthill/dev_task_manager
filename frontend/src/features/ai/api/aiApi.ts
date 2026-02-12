import { api } from '@/lib/axios'
import { getAiHeaders } from './aiHeaders'
import type { AiActionRequest, AiActionResponse, AiChatRequest, AiChatResponse, PerCardInsightsResponse } from '@/shared/types'

export const aiApi = {
    executeAction: async (request: AiActionRequest) => {
        const { data } = await api.post<AiActionResponse>('/ai/action', request, {
            headers: getAiHeaders(),
        })
        return data
    },

    /** Chat IA contextual do card */
    chat: async (request: AiChatRequest) => {
        const { data } = await api.post<AiChatResponse>('/ai/chat', request, {
            headers: getAiHeaders(),
        })
        return data
    },

    /** Gera insights individuais para cada card com aiEnabled=true */
    generatePerCardInsights: async (action: string) => {
        const { data } = await api.post<PerCardInsightsResponse>('/ai/insights/per-card', {
            action,
        }, {
            headers: getAiHeaders(),
        })
        return data
    },
}
