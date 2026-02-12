import { useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from './workspaceApi'

export function useDeleteWorkspace() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => workspaceApi.excluir(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        },
    })
}
