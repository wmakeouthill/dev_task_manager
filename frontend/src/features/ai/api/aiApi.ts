import { api } from '@/lib/axios'
import { getAiHeaders } from './aiHeaders'
import type { AiActionRequest, AiActionResponse, AiChatRequest, AiChatResponse } from '@/shared/types'

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

    /** Gera insights para todos os cards com aiEnabled=true */
    generateInsights: async (action: string) => {
        const { data } = await api.post<AiActionResponse>('/ai/action', {
            action,
            cardId: '00000000-0000-0000-0000-000000000000',
        }, {
            headers: getAiHeaders(),
        })
        return data
    },
}
