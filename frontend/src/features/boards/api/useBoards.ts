import { useQuery } from '@tanstack/react-query'
import { boardApi } from './boardApi'

export function useBoards(workspaceId: string | null, page = 1, size = 20) {
  return useQuery({
    queryKey: ['boards', workspaceId, { page, size }],
    queryFn: () =>
      boardApi.listarPorWorkspace(workspaceId!, page, size),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })
}
