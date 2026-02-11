import { api } from '@/lib/axios'
import type { AiActionRequest, AiActionResponse } from '@/shared/types'

export const aiApi = {
    executeAction: async (request: AiActionRequest) => {
        const { data } = await api.post<AiActionResponse>('/ai/action', request)
        return data
    },
}
