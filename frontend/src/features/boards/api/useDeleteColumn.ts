import { useMutation, useQueryClient } from '@tanstack/react-query'
import { columnApi } from './columnApi'

export function useDeleteColumn(boardId: string | null) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => columnApi.excluir(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            queryClient.invalidateQueries({ queryKey: ['boards'] })
        },
    })
}
