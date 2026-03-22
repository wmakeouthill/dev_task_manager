import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { noteApi } from './noteApi'
import type {
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  UpdateStickyNotePositionRequest,
  AiNoteAssistRequest,
} from '../types'

const QUERY_KEY = ['sticky-notes']

export function useNotes(boardId?: string) {
  return useQuery({
    queryKey: boardId ? [...QUERY_KEY, boardId] : QUERY_KEY,
    queryFn: () => noteApi.list(boardId),
  })
}

export function useCreateNote(boardId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateStickyNoteRequest) => noteApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardId ? [...QUERY_KEY, boardId] : QUERY_KEY })
    },
  })
}

export function useUpdateNote(boardId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStickyNoteRequest }) =>
      noteApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardId ? [...QUERY_KEY, boardId] : QUERY_KEY })
    },
  })
}

export function useUpdateNotePosition(boardId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStickyNotePositionRequest }) =>
      noteApi.updatePosition(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardId ? [...QUERY_KEY, boardId] : QUERY_KEY })
    },
  })
}

export function useDeleteNote(boardId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => noteApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardId ? [...QUERY_KEY, boardId] : QUERY_KEY })
    },
  })
}

export function useAiNoteAssist() {
  return useMutation({
    mutationFn: (data: AiNoteAssistRequest) => noteApi.aiAssist(data),
  })
}
