import { useMutation, useQueryClient } from '@tanstack/react-query'
import { columnApi, type CreateColumnRequest } from './columnApi'

export function useAddColumn(boardId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateColumnRequest) =>
      columnApi.adicionar(boardId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', boardId] })
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}
