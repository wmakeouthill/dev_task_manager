import { useQuery } from '@tanstack/react-query'
import { workspaceApi } from './workspaceApi'

export function useWorkspaces(page = 1, size = 20) {
  return useQuery({
    queryKey: ['workspaces', { page, size }],
    queryFn: () => workspaceApi.listar(page, size),
    staleTime: 30_000,
  })
}
