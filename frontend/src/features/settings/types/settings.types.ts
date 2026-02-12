/** Configuração de um provedor de IA */
export type AiProviderType = 'openai' | 'anthropic' | 'gemini' | 'ollama'

export interface AiProviderConfig {
    provider: AiProviderType
    apiKey: string
    model: string
    baseUrl: string
    enabled: boolean
}

/** Configurações da aplicação salvas localmente */
export interface AppSettings {
    aiProviders: AiProviderConfig[]
}

/** Formato legado para migração */
interface LegacyAppSettings {
    apiKey?: string
    aiProvider?: AiProviderType
    aiModel?: string
    aiBaseUrl?: string
}

/** Labels amigáveis para exibição dos modelos (estilo das interfaces oficiais) */
export const MODEL_LABELS: Record<string, string> = {
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4o': 'GPT-4o',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
    'gemini-pro': 'Gemini Pro',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'llama3': 'Llama 3',
    'mistral': 'Mistral',
    'codellama': 'Code Llama',
}

export function getModelLabel(modelId: string): string {
    return MODEL_LABELS[modelId] ?? modelId
}

export const AI_PROVIDERS = [
    { value: 'openai' as const, label: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'anthropic' as const, label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
    { value: 'gemini' as const, label: 'Google Gemini', models: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
    { value: 'ollama' as const, label: 'Ollama (Local)', models: ['llama3', 'mistral', 'codellama'] },
] as const

function createDefaultProviderConfig(provider: AiProviderType): AiProviderConfig {
    const p = AI_PROVIDERS.find((x) => x.value === provider)!
    return {
        provider,
        apiKey: '',
        model: p.models[0],
        baseUrl: provider === 'ollama' ? 'http://localhost:11434' : '',
        enabled: provider === 'openai',
    }
}

export const DEFAULT_SETTINGS: AppSettings = {
    aiProviders: AI_PROVIDERS.map((p) => createDefaultProviderConfig(p.value)),
}

export function migrateFromLegacy(raw: unknown): AppSettings {
    const legacy = raw as LegacyAppSettings | null
    if (!legacy || !('apiKey' in legacy) || !('aiProvider' in legacy)) {
        return DEFAULT_SETTINGS
    }
    const base = DEFAULT_SETTINGS.aiProviders.map((config) => ({ ...config }))
    const idx = base.findIndex((c) => c.provider === legacy.aiProvider)
    if (idx >= 0) {
        base[idx] = {
            provider: legacy.aiProvider!,
            apiKey: legacy.apiKey ?? '',
            model: legacy.aiModel ?? base[idx].model,
            baseUrl: legacy.aiBaseUrl ?? base[idx].baseUrl,
            enabled: true,
        }
    }
    return { aiProviders: base }
}

/** Retorna o primeiro provedor habilitado com chave válida (ou Ollama) */
export function getActiveProvider(settings: AppSettings): AiProviderConfig | null {
    return (
        settings.aiProviders.find(
            (c) =>
                c.enabled &&
                (c.apiKey.trim() !== '' || c.provider === 'ollama')
        ) ?? null
    )
}
