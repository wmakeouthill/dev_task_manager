import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commentApi, checklistApi } from './cardExtrasApi'

export function useComments(cardId: string | null) {
    return useQuery({
        queryKey: ['comments', cardId],
        queryFn: () => commentApi.listar(cardId!),
        enabled: !!cardId,
    })
}

export function useAddComment(cardId: string | null) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (texto: string) => commentApi.criar(cardId!, texto),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', cardId] }),
    })
}

export function useDeleteComment(cardId: string | null) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => commentApi.excluir(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', cardId] }),
    })
}

export function useChecklist(cardId: string | null) {
    return useQuery({
        queryKey: ['checklist', cardId],
        queryFn: () => checklistApi.listar(cardId!),
        enabled: !!cardId,
    })
}

export function useAddChecklistItem(cardId: string | null) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ texto, ordem }: { texto: string; ordem?: number }) =>
            checklistApi.criar(cardId!, texto, ordem),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', cardId] }),
    })
}

export function useToggleChecklistItem(cardId: string | null) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (itemId: string) => checklistApi.toggle(itemId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', cardId] }),
    })
}

export function useDeleteChecklistItem(cardId: string | null) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (itemId: string) => checklistApi.excluir(itemId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['checklist', cardId] }),
    })
}
