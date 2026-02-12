import { useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from './workspaceApi'
import type { UpdateWorkspaceRequest } from '../types/workspace.types'

export function useUpdateWorkspace() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceRequest }) =>
            workspaceApi.atualizar(id, data),
        onSuccess: (_result, variables) => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] })
            queryClient.invalidateQueries({ queryKey: ['workspace', variables.id] })
        },
    })
}
