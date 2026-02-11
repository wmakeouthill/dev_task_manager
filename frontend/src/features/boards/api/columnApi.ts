import { api } from '@/lib/axios'
import type { ColumnDto } from '../types/board.types'

export interface CreateColumnRequest {
  nome: string
  ordem?: number
}

export interface UpdateColumnRequest {
  nome?: string | null
  wipLimit?: number | null
}

export interface MoveColumnRequest {
  novaOrdem: number
}

export const columnApi = {
  adicionar: (boardId: string, data: CreateColumnRequest) =>
    api
      .post<ColumnDto>(`/boards/${boardId}/columns`, data)
      .then((r) => r.data),

  atualizar: (id: string, data: UpdateColumnRequest) =>
    api.put<ColumnDto>(`/columns/${id}`, data).then((r) => r.data),

  excluir: (id: string) => api.delete(`/columns/${id}`),

  mover: (id: string, data: MoveColumnRequest) =>
    api.post<ColumnDto>(`/columns/${id}/move`, data).then((r) => r.data),
}
