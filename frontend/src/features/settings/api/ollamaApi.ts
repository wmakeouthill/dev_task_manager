import { api } from '@/lib/axios'

export interface OllamaModelsResponse {
    baseUrl: string
    models: string[]
    runningModels: string[]
    installedModels: string[]
}

export async function fetchOllamaModels(baseUrl: string): Promise<OllamaModelsResponse> {
    const { data } = await api.get<OllamaModelsResponse>('/ai/ollama/models', {
        params: { baseUrl },
    })
    return data
}
