import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import type { CardSearchResult } from '@/shared/types'

async function searchCards(query: string, limit = 10): Promise<CardSearchResult[]> {
    const { data } = await api.get<CardSearchResult[]>('/cards/search', {
        params: { q: query, limit },
    })
    return data
}

/**
 * Hook para buscar cards por texto (usado no slash command do chat).
 * Só dispara a query quando o termo tem >= 2 caracteres.
 */
export function useCardSearch(query: string) {
    return useQuery({
        queryKey: ['card-search', query],
        queryFn: () => searchCards(query),
        enabled: query.length >= 2,
        staleTime: 10_000,
    })
}
