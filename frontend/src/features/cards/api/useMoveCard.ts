import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cardApi } from './cardApi'
import type { MoveCardRequest } from '../types/card.types'

export function useMoveCard(boardId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveCardRequest }) =>
      cardApi.mover(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards', boardId] })
    },
  })
}
