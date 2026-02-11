import { useCallback, useSyncExternalStore } from 'react'
import type { AppSettings } from '../types/settings.types'
import { DEFAULT_SETTINGS } from '../types/settings.types'

const STORAGE_KEY = 'devtaskmanager:settings'

function getSnapshot(): AppSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_SETTINGS
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
        return DEFAULT_SETTINGS
    }
}

function saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
}

const subscribe = (callback: () => void) => {
    const handler = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY || e.key === null) callback()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
}

/** Hook reativo para ler/salvar configurações do localStorage */
export function useSettings() {
    const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    const updateSettings = useCallback((patch: Partial<AppSettings>) => {
        const current = getSnapshot()
        saveSettings({ ...current, ...patch })
    }, [])

    const resetSettings = useCallback(() => {
        saveSettings(DEFAULT_SETTINGS)
    }, [])

    return { settings, updateSettings, resetSettings }
}

/** Leitura direta fora de componentes React */
export function readSettings(): AppSettings {
    return getSnapshot()
}
