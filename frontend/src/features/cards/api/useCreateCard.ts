import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cardApi } from './cardApi'
import type { CreateCardRequest } from '../types/card.types'

export function useCreateCard(boardId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCardRequest) =>
      cardApi.criar(boardId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', boardId] })
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })
}
