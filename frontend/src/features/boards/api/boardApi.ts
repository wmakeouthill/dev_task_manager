import { api } from '@/lib/axios'
import type { PagedResponse } from '@/shared/types/api.types'
import type {
  Board,
  CreateBoardRequest,
  UpdateBoardRequest,
} from '../types/board.types'

export const boardApi = {
  listarPorWorkspace: (workspaceId: string, page = 1, size = 20) =>
    api
      .get<PagedResponse<Board>>(
        `/workspaces/${workspaceId}/boards`,
        { params: { page, size } }
      )
      .then((r) => r.data),

  buscarPorId: (id: string) =>
    api.get<Board>(`/boards/${id}`).then((r) => r.data),

  criar: (workspaceId: string, data: CreateBoardRequest) =>
    api
      .post<Board>(`/workspaces/${workspaceId}/boards`, data)
      .then((r) => r.data),

  atualizar: (id: string, data: UpdateBoardRequest) =>
    api.put<Board>(`/boards/${id}`, data).then((r) => r.data),

  excluir: (id: string) => api.delete(`/boards/${id}`),
}
