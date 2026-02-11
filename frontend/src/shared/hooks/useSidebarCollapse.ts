import { useSyncExternalStore, useCallback } from 'react'

const STORAGE_KEY = 'devtaskmanager:sidebar-collapsed'

function getSnapshot(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'true'
}

function subscribe(callback: () => void) {
    const handler = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY || e.key === null) callback()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
}

/** Hook para controlar o estado recolhido/expandido da sidebar */
export function useSidebarCollapse() {
    const collapsed = useSyncExternalStore(subscribe, getSnapshot, () => false)

    const toggle = useCallback(() => {
        const next = !getSnapshot()
        localStorage.setItem(STORAGE_KEY, String(next))
        window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
    }, [])

    return { collapsed, toggle }
}
