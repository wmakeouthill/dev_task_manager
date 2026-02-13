import { useState } from 'react'
import type { ApiProviderCardProps } from './ApiProviderCard.types'

export function ApiProviderCard({
    config,
    providerLabel,
    models,
    runningModels = [],
    getModelLabel,
    onUpdate,
    onToggle,
}: ApiProviderCardProps) {
    const [showKey, setShowKey] = useState(false)

    return (
        <article
            className={`api-provider-card ${config.enabled ? 'api-provider-card--enabled' : 'api-provider-card--disabled'}`}
            data-enabled={config.enabled}
        >
            <div className="api-provider-card__cell api-provider-card__cell--provider">
                <h3 className="api-provider-card__title">{providerLabel}</h3>
            </div>

            <div className="api-provider-card__cell api-provider-card__cell--apikey-or-baseurl">
                {config.provider !== 'ollama' ? (
                    <div className="api-provider-card__field">
                        <label className="label" htmlFor={`api-key-${config.provider}`}>
                            API Key
                        </label>
                        <div className="settings-key-wrapper">
                            <input
                                id={`api-key-${config.provider}`}
                                className="input"
                                type={showKey ? 'text' : 'password'}
                                value={config.apiKey}
                                onChange={(e) => onUpdate({ apiKey: e.target.value })}
                                placeholder="sk-..."
                                autoComplete="off"
                                disabled={!config.enabled}
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
                ) : (
                    <div className="api-provider-card__field">
                        <label className="label" htmlFor={`base-url-${config.provider}`}>
                            Base URL
                        </label>
                        <input
                            id={`base-url-${config.provider}`}
                            className="input"
                            value={config.baseUrl}
                            onChange={(e) => onUpdate({ baseUrl: e.target.value })}
                            placeholder="http://localhost:11434"
                            disabled={!config.enabled}
                        />
                    </div>
                )}
            </div>

            <div className="api-provider-card__cell api-provider-card__cell--model">
                <div className="api-provider-card__field">
                    <label className="label" htmlFor={`model-${config.provider}`}>
                        Modelo
                    </label>
                    {config.provider === 'ollama' ? (
                        <>
                            <select
                                id={`model-${config.provider}`}
                                className="select settings-select"
                                value={config.model}
                                onChange={(e) => onUpdate({ model: e.target.value })}
                                disabled={!config.enabled}
                            >
                                {!models.includes(config.model) && config.model.trim() !== '' && (
                                    <option value={config.model}>{config.model}</option>
                                )}
                                {models.map((m) => (
                                    <option key={m} value={m}>
                                        {getModelLabel(m)}
                                    </option>
                                ))}
                            </select>
                            {runningModels.length > 0 && (
                                <p className="settings-hint" aria-live="polite">
                                    Em execução agora: {runningModels.join(', ')}
                                </p>
                            )}
                        </>
                    ) : (
                        <select
                            id={`model-${config.provider}`}
                            className="select settings-select"
                            value={config.model}
                            onChange={(e) => onUpdate({ model: e.target.value })}
                            disabled={!config.enabled}
                        >
                            {models.map((m) => (
                                <option key={m} value={m}>
                                    {getModelLabel(m)}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="api-provider-card__cell api-provider-card__cell--toggle">
                <button
                    type="button"
                    role="switch"
                    aria-checked={config.enabled}
                    aria-label={`${config.enabled ? 'Desativar' : 'Ativar'} ${providerLabel}`}
                    className="api-provider-card__toggle"
                    onClick={() => onToggle(!config.enabled)}
                    title={config.enabled ? 'Desativar' : 'Ativar'}
                >
                    <span className="api-provider-card__toggle-slider" />
                </button>
            </div>
        </article>
    )
}
