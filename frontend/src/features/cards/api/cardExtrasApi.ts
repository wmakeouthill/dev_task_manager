import { api } from '@/lib/axios'
import type { CommentData, ChecklistItemData, PagedResponse } from '@/shared/types'

export const commentApi = {
    listar: (cardId: string, page = 1, size = 50) =>
        api
            .get<PagedResponse<CommentData>>(`/cards/${cardId}/comments`, {
                params: { page, size },
            })
            .then((r) => r.data),

    criar: (cardId: string, texto: string, autor?: string) =>
        api
            .post<CommentData>(`/cards/${cardId}/comments`, { texto, autor })
            .then((r) => r.data),

    excluir: (id: string) => api.delete(`/comments/${id}`),
}

export const checklistApi = {
    listar: (cardId: string) =>
        api
            .get<ChecklistItemData[]>(`/cards/${cardId}/checklist`)
            .then((r) => r.data),

    criar: (cardId: string, texto: string, ordem = 0) =>
        api
            .post<ChecklistItemData>(`/cards/${cardId}/checklist`, { texto, ordem })
            .then((r) => r.data),

    toggle: (itemId: string) =>
        api
            .patch<ChecklistItemData>(`/checklist/${itemId}/toggle`)
            .then((r) => r.data),

    excluir: (itemId: string) => api.delete(`/checklist/${itemId}`),
}
