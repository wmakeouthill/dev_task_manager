import type { AiProviderConfig } from '../../types/settings.types'

export interface ApiProviderCardProps {
    config: AiProviderConfig
    providerLabel: string
    models: readonly string[]
    runningModels?: readonly string[]
    getModelLabel: (id: string) => string
    onUpdate: (patch: Partial<AiProviderConfig>) => void
    onToggle: (enabled: boolean) => void
}
