import { useState, type FormEvent } from 'react'
import { useSettings } from '../hooks/useSettings'
import { AI_PROVIDERS, getModelLabel } from '../types/settings.types'
import { ApiProviderCard } from '../components/ApiProviderCard'

export function SettingsPage() {
  const { settings, updateProviderConfig, resetSettings } = useSettings()
  const [saved, setSaved] = useState(false)

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
              return (
                <ApiProviderCard
                  key={config.provider}
                  config={config}
                  providerLabel={providerMeta.label}
                  models={providerMeta.models}
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
