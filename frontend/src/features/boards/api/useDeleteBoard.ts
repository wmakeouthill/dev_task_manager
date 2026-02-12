import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardApi } from './boardApi'

export function useDeleteBoard(workspaceId: string | null) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => boardApi.excluir(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] })
            queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        },
    })
}
