import { readSettings, getActiveProvider } from '@/features/settings'

/** Monta headers HTTP com a configuração do provider de IA ativo */
export function getAiHeaders(): Record<string, string> {
    const settings = readSettings()
    const provider = getActiveProvider(settings)
    if (!provider) return {}
    return {
        'X-AI-Provider': provider.provider,
        'X-AI-ApiKey': provider.apiKey,
        'X-AI-Model': provider.model,
        ...(provider.baseUrl ? { 'X-AI-BaseUrl': provider.baseUrl } : {}),
    }
}
