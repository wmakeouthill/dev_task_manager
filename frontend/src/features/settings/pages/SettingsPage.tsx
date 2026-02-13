import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSettings } from '../hooks/useSettings'
import { AI_PROVIDERS, getModelLabel } from '../types/settings.types'
import { ApiProviderCard } from '../components/ApiProviderCard'
import { fetchOllamaModels } from '../api/ollamaApi'

const OLLAMA_MODELS_CACHE_KEY = 'devtaskmanager:ollama-models-cache'

function readCachedOllamaModels(baseUrl: string): string[] {
  try {
    const raw = localStorage.getItem(OLLAMA_MODELS_CACHE_KEY)
    if (!raw) return []
    const cache = JSON.parse(raw) as Record<string, string[]>
    const models = cache[baseUrl]
    return Array.isArray(models) ? models : []
  } catch {
    return []
  }
}

function writeCachedOllamaModels(baseUrl: string, models: string[]): void {
  try {
    const raw = localStorage.getItem(OLLAMA_MODELS_CACHE_KEY)
    const cache = raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
    cache[baseUrl] = models
    localStorage.setItem(OLLAMA_MODELS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // noop
  }
}

export function SettingsPage() {
  const { settings, updateProviderConfig, resetSettings } = useSettings()
  const [saved, setSaved] = useState(false)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [ollamaRunningModels, setOllamaRunningModels] = useState<string[]>([])

  const ollamaConfig = useMemo(
    () => settings.aiProviders.find((p) => p.provider === 'ollama') ?? null,
    [settings.aiProviders]
  )

  useEffect(() => {
    const baseUrl = ollamaConfig?.baseUrl?.trim()
    if (!baseUrl) {
      setOllamaModels([])
      setOllamaRunningModels([])
      return
    }

    const cached = readCachedOllamaModels(baseUrl)
    if (cached.length > 0) {
      setOllamaModels(cached)
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetchOllamaModels(baseUrl)
        if (!cancelled) {
          setOllamaModels(response.models)
          setOllamaRunningModels(response.runningModels)
          writeCachedOllamaModels(baseUrl, response.models)
        }
      } catch {
        if (!cancelled) {
          setOllamaModels(cached)
          setOllamaRunningModels([])
        }
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [ollamaConfig?.baseUrl])

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (confirm('Restaurar configurações padrão?')) {
      resetSettings()
    }
  }

  return (
    <div className="page settings-page">
      <h1 className="page-title">⚙️ Configurações</h1>

      <form onSubmit={handleSave}>
        <section className="card settings-section">
          <h2 className="section-title">🔑 APIs de IA</h2>
          <p className="settings-hint">
            Configure múltiplas APIs e ative/desative cada uma com o botão. A chave é salva apenas localmente no seu navegador.
          </p>

          <div className="api-provider-cards">
            {settings.aiProviders.map((config) => {
              const providerMeta = AI_PROVIDERS.find((p) => p.value === config.provider)!
              const models: readonly string[] =
                config.provider === 'ollama' && ollamaModels.length > 0
                  ? ollamaModels
                  : providerMeta.models
              return (
                <ApiProviderCard
                  key={config.provider}
                  config={config}
                  providerLabel={providerMeta.label}
                  models={models}
                  runningModels={config.provider === 'ollama' ? ollamaRunningModels : []}
                  getModelLabel={getModelLabel}
                  onUpdate={(patch) =>
                    updateProviderConfig(config.provider, patch)
                  }
                  onToggle={(enabled) =>
                    updateProviderConfig(config.provider, { enabled })
                  }
                />
              )
            })}
          </div>
        </section>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary">
            {saved ? '✓ Salvo!' : '💾 Salvar configurações'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleReset}>
            Restaurar padrão
          </button>
        </div>
      </form>
    </div>
  )
}
