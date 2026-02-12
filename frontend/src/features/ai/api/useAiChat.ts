import { useMutation } from '@tanstack/react-query'
import { aiApi } from './aiApi'
import type { AiChatRequest } from '@/shared/types'

export function useAiChat() {
    return useMutation({
        mutationFn: (request: AiChatRequest) => aiApi.chat(request),
    })
}
