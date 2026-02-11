import { useState, useEffect, type FormEvent } from 'react'
import { useSettings } from '../hooks/useSettings'
import { AI_PROVIDERS } from '../types/settings.types'
import type { AppSettings } from '../types/settings.types'

export function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const [form, setForm] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const provider = AI_PROVIDERS.find((p) => p.value === form.aiProvider)

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateSettings(form)
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
        {/* API Key Section */}
        <section className="card settings-section">
          <h2 className="section-title">🔑 API Key</h2>
          <p className="settings-hint">
            Configure sua chave de API para habilitar insights por IA. A chave é salva apenas localmente no seu navegador.
          </p>

          <div className="settings-field">
            <label className="label" htmlFor="ai-provider">Provedor</label>
            <select
              id="ai-provider"
              className="select settings-select"
              value={form.aiProvider}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  aiProvider: e.target.value as AppSettings['aiProvider'],
                  aiModel: AI_PROVIDERS.find((p) => p.value === e.target.value)?.models[0] ?? '',
                }))
              }
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-field">
            <label className="label" htmlFor="api-key">API Key</label>
            <div className="settings-key-wrapper">
              <input
                id="api-key"
                className="input"
                type={showKey ? 'text' : 'password'}
                value={form.apiKey}
                onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder={form.aiProvider === 'ollama' ? 'Não necessário para Ollama' : 'sk-...'}
                autoComplete="off"
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setShowKey((v) => !v)}
                aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
              >
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="settings-field">
            <label className="label" htmlFor="ai-model">Modelo</label>
            <select
              id="ai-model"
              className="select settings-select"
              value={form.aiModel}
              onChange={(e) => setForm((prev) => ({ ...prev, aiModel: e.target.value }))}
            >
              {provider?.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {form.aiProvider === 'ollama' && (
            <div className="settings-field">
              <label className="label" htmlFor="ai-base-url">Base URL (Ollama)</label>
              <input
                id="ai-base-url"
                className="input"
                value={form.aiBaseUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, aiBaseUrl: e.target.value }))}
                placeholder="http://localhost:11434"
              />
            </div>
          )}
        </section>

        {/* Actions */}
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
