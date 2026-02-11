import { api } from '@/lib/axios'
import type { PagedResponse } from '@/shared/types/api.types'
import type {
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from '../types/workspace.types'

export const workspaceApi = {
  listar: (page = 1, size = 20) =>
    api
      .get<PagedResponse<Workspace>>('/workspaces', { params: { page, size } })
      .then((r) => r.data),

  buscarPorId: (id: string) =>
    api.get<Workspace>(`/workspaces/${id}`).then((r) => r.data),

  criar: (data: CreateWorkspaceRequest) =>
    api.post<Workspace>('/workspaces', data).then((r) => r.data),

  atualizar: (id: string, data: UpdateWorkspaceRequest) =>
    api.put<Workspace>(`/workspaces/${id}`, data).then((r) => r.data),

  excluir: (id: string) => api.delete(`/workspaces/${id}`),
}
