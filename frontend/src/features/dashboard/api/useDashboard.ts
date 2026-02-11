import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboardApi'

export function useDashboard() {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardApi.getDashboard,
        refetchInterval: 30_000,
    })
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ['current-user'],
        queryFn: dashboardApi.getCurrentUser,
        staleTime: 5 * 60_000,
    })
}
