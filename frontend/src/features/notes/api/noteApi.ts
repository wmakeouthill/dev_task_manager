import { api } from '@/lib/axios'
import { getAiHeaders } from '@/features/ai'
import type {
  StickyNote,
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  UpdateStickyNotePositionRequest,
  AiNoteAssistRequest,
  AiNoteAssistResponse,
} from '../types'

export const noteApi = {
  list: (boardId?: string): Promise<StickyNote[]> =>
    api.get('/notes', { params: boardId ? { boardId } : undefined }).then(r => r.data),

  listRecent: (limit = 5): Promise<StickyNote[]> =>
    api.get('/notes/recent', { params: { limit } }).then(r => r.data),

  get: (id: string): Promise<StickyNote> =>
    api.get(`/notes/${id}`).then(r => r.data),

  create: (data: CreateStickyNoteRequest): Promise<StickyNote> =>
    api.post('/notes', data).then(r => r.data),

  update: (id: string, data: UpdateStickyNoteRequest): Promise<StickyNote> =>
    api.put(`/notes/${id}`, data).then(r => r.data),

  updatePosition: (id: string, data: UpdateStickyNotePositionRequest): Promise<StickyNote> =>
    api.patch(`/notes/${id}/position`, data).then(r => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/notes/${id}`).then(() => undefined),

  aiAssist: (data: AiNoteAssistRequest): Promise<AiNoteAssistResponse> =>
    api.post('/notes/ai-assist', data, { headers: getAiHeaders() }).then(r => r.data),
}
