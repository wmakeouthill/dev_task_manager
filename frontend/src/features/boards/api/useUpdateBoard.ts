import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardApi } from './boardApi'
import type { UpdateBoardRequest } from '../types/board.types'

export function useUpdateBoard() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBoardRequest }) =>
            boardApi.atualizar(id, data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['boards', result.workspaceId] })
            queryClient.invalidateQueries({ queryKey: ['board', result.id] })
        },
    })
}
