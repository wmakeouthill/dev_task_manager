import { useQuery } from '@tanstack/react-query'
import { cardApi } from './cardApi'

export function useCards(
  boardId: string | null,
  page = 1,
  size = 100,
  status?: string
) {
  return useQuery({
    queryKey: ['cards', boardId, { page, size, status }],
    queryFn: () =>
      cardApi.listarPorBoard(boardId!, page, size, status),
    enabled: !!boardId,
    staleTime: 30_000,
  })
}
