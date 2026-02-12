import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { insightsApi } from './insightsApi'
import type { SaveInsightsRequest } from '@/shared/types'

export function useInsights() {
    return useQuery({
        queryKey: ['insights'],
        queryFn: insightsApi.list,
        staleTime: 60_000,
    })
}

export function useSaveInsights() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (request: SaveInsightsRequest) => insightsApi.save(request),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insights'] }),
    })
}

export function useDeleteInsight() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => insightsApi.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insights'] }),
    })
}

export function useDeleteAllInsights() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => insightsApi.removeAll(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['insights'] }),
    })
}
