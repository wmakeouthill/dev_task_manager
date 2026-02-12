import { useQuery } from '@tanstack/react-query'
import { workspaceApi } from './workspaceApi'

export function useWorkspace(id: string | null) {
    return useQuery({
        queryKey: ['workspace', id],
        queryFn: () => workspaceApi.buscarPorId(id!),
        enabled: !!id,
        staleTime: 30_000,
    })
}
