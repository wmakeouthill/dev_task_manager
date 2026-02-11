import { api } from '@/lib/axios'
import type { PagedResponse } from '@/shared/types/api.types'
import type {
  Card,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest,
  UpdateCardStatusRequest,
} from '../types/card.types'

export const cardApi = {
  listarPorBoard: (
    boardId: string,
    page = 1,
    size = 100,
    status?: string
  ) =>
    api
      .get<PagedResponse<Card>>(`/boards/${boardId}/cards`, {
        params: { page, size, status },
      })
      .then((r) => r.data),

  buscarPorId: (id: string) =>
    api.get<Card>(`/cards/${id}`).then((r) => r.data),

  criar: (boardId: string, data: CreateCardRequest) =>
    api
      .post<Card>(`/boards/${boardId}/cards`, data)
      .then((r) => r.data),

  atualizar: (id: string, data: UpdateCardRequest) =>
    api.put<Card>(`/cards/${id}`, data).then((r) => r.data),

  mover: (id: string, data: MoveCardRequest) =>
    api.patch<Card>(`/cards/${id}/move`, data).then((r) => r.data),

  atualizarStatus: (id: string, data: UpdateCardStatusRequest) =>
    api.patch<Card>(`/cards/${id}/status`, data).then((r) => r.data),

  excluir: (id: string) => api.delete(`/cards/${id}`),
}
