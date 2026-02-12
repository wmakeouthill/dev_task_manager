import { useCallback, useSyncExternalStore } from 'react'
import type { AppSettings, AiProviderConfig, AiProviderType } from '../types/settings.types'
import { DEFAULT_SETTINGS, migrateFromLegacy } from '../types/settings.types'

const STORAGE_KEY = 'devtaskmanager:settings'
let cachedRaw: string | null = null
let cachedSnapshot: AppSettings = DEFAULT_SETTINGS

function getSnapshot(): AppSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw === cachedRaw) return cachedSnapshot
        cachedRaw = raw
        if (!raw) {
            cachedSnapshot = DEFAULT_SETTINGS
            return cachedSnapshot
        }
        const parsed = JSON.parse(raw) as unknown
        if (parsed && typeof parsed === 'object' && 'aiProviders' in parsed && Array.isArray(parsed.aiProviders)) {
            cachedSnapshot = parsed as AppSettings
        } else {
            cachedSnapshot = migrateFromLegacy(parsed)
        }
        return cachedSnapshot
    } catch {
        cachedRaw = null
        cachedSnapshot = DEFAULT_SETTINGS
        return cachedSnapshot
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

    const updateProviderConfig = useCallback(
        (provider: AiProviderType, patch: Partial<AiProviderConfig>) => {
            const current = getSnapshot()
            const providers = current.aiProviders.map((c) =>
                c.provider === provider ? { ...c, ...patch } : c
            )
            saveSettings({ aiProviders: providers })
        },
        []
    )

    const resetSettings = useCallback(() => {
        saveSettings(DEFAULT_SETTINGS)
    }, [])

    return { settings, updateSettings, updateProviderConfig, resetSettings }
}

/** Leitura direta fora de componentes React */
export function readSettings(): AppSettings {
    return getSnapshot()
}
