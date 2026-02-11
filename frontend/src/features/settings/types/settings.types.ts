/** Configurações da aplicação salvas localmente */
export interface AppSettings {
    apiKey: string
    aiProvider: 'openai' | 'anthropic' | 'gemini' | 'ollama'
    aiModel: string
    aiBaseUrl: string
}

export const DEFAULT_SETTINGS: AppSettings = {
    apiKey: '',
    aiProvider: 'openai',
    aiModel: 'gpt-4o-mini',
    aiBaseUrl: '',
}

export const AI_PROVIDERS = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'] },
    { value: 'gemini', label: 'Google Gemini', models: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
    { value: 'ollama', label: 'Ollama (Local)', models: ['llama3', 'mistral', 'codellama'] },
] as const
