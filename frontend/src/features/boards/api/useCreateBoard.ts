import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boardApi } from './boardApi'
import type { CreateBoardRequest } from '../types/board.types'

export function useCreateBoard(workspaceId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBoardRequest) =>
      boardApi.criar(workspaceId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}
