import { useQuery } from '@tanstack/react-query'
import { boardApi } from './boardApi'

export function useBoard(boardId: string | null) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardApi.buscarPorId(boardId!),
    enabled: !!boardId,
    staleTime: 30_000,
  })
}
