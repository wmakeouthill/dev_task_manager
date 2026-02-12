import { useMutation } from '@tanstack/react-query'
import { aiApi } from './aiApi'

export function usePerCardInsights() {
    return useMutation({
        mutationFn: (action: string) => aiApi.generatePerCardInsights(action),
    })
}
