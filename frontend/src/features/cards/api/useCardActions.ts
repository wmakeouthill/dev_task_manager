import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cardApi } from './cardApi'
import type { UpdateCardRequest, UpdateCardStatusRequest } from '../types/card.types'

export function useCard(cardId: string | null) {
    return useQuery({
        queryKey: ['card', cardId],
        queryFn: () => cardApi.buscarPorId(cardId!),
        enabled: !!cardId,
    })
}

export function useUpdateCard(boardId: string | null) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCardRequest }) =>
            cardApi.atualizar(id, data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['cards', boardId] })
            qc.invalidateQueries({ queryKey: ['card', vars.id] })
            qc.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}

export function useUpdateCardStatus(boardId: string | null) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCardStatusRequest }) =>
            cardApi.atualizarStatus(id, data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['cards', boardId] })
            qc.invalidateQueries({ queryKey: ['card', vars.id] })
            qc.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}

export function useDeleteCard(boardId: string | null) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => cardApi.excluir(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['cards', boardId] })
            qc.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}
