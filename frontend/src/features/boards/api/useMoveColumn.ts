import { useMutation, useQueryClient } from '@tanstack/react-query'
import { columnApi } from './columnApi'
import type { MoveColumnRequest } from './columnApi'

export function useMoveColumn(boardId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveColumnRequest }) =>
      columnApi.mover(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}
