import { useState, useCallback } from 'react'

const STORAGE_KEY = 'boards-nav-selected-workspace'

export function useBoardsNavigation() {
    const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(() => {
        try {
            return localStorage.getItem(STORAGE_KEY)
        } catch {
            return null
        }
    })

    const setSelectedWorkspaceId = useCallback((id: string | null) => {
        setSelectedWorkspaceIdState(id)
        try {
            if (id) {
                localStorage.setItem(STORAGE_KEY, id)
            } else {
                localStorage.removeItem(STORAGE_KEY)
            }
        } catch {
            // localStorage unavailable
        }
    }, [])

    return { selectedWorkspaceId, setSelectedWorkspaceId }
}
