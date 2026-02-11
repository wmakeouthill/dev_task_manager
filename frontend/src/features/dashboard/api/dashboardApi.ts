import { api } from '@/lib/axios'
import type { DashboardData, WindowsUser } from '@/shared/types'

export const dashboardApi = {
    getDashboard: async () => {
        const { data } = await api.get<DashboardData>('/dashboard')
        return data
    },

    getCurrentUser: async () => {
        const { data } = await api.get<WindowsUser>('/dashboard/user')
        return data
    },
}
