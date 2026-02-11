import { useMutation } from '@tanstack/react-query'
import { aiApi } from '../api/aiApi'
import type { AiActionRequest } from '@/shared/types'

export function useAiAction() {
    return useMutation({
        mutationFn: (request: AiActionRequest) => aiApi.executeAction(request),
    })
}
