import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reminderApi } from './reminderApi'

export function useReminders() {
    return useQuery({
        queryKey: ['reminders'],
        queryFn: () => reminderApi.listar(),
        refetchInterval: 60_000,
    })
}

export function useCreateReminder() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: reminderApi.criar,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['reminders'] })
            qc.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}

export function useSnoozeReminder() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, until }: { id: string; until: string }) =>
            reminderApi.snooze(id, until),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
    })
}

export function useCancelReminder() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => reminderApi.cancelar(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['reminders'] })
            qc.invalidateQueries({ queryKey: ['dashboard'] })
        },
    })
}
