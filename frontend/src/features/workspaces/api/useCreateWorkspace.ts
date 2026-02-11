import { useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from './workspaceApi'
import type { CreateWorkspaceRequest } from '../types/workspace.types'

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWorkspaceRequest) => workspaceApi.criar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}
