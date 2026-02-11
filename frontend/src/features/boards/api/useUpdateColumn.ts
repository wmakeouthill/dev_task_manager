import { useMutation, useQueryClient } from '@tanstack/react-query'
import { columnApi, type UpdateColumnRequest } from './columnApi'

export function useUpdateColumn(boardId: string | null) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateColumnRequest }) =>
            columnApi.atualizar(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
            queryClient.invalidateQueries({ queryKey: ['boards'] })
        },
    })
}
