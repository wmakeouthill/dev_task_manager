import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { noteApi } from './noteApi'
import type {
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  UpdateStickyNotePositionRequest,
  AiNoteAssistRequest,
} from '../types'

const QUERY_KEY = ['sticky-notes']

export function useNotes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: noteApi.list,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateStickyNoteRequest) => noteApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStickyNoteRequest }) =>
      noteApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateNotePosition() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStickyNotePositionRequest }) =>
      noteApi.updatePosition(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => noteApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useAiNoteAssist() {
  return useMutation({
    mutationFn: (data: AiNoteAssistRequest) => noteApi.aiAssist(data),
  })
}
