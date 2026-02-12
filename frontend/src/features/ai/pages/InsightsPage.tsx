import { useState } from 'react'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import { useAiAction } from '@/features/ai'
import { useSettings } from '@/features/settings'

export function InsightsPage() {
  const { settings } = useSettings()
  const aiAction = useAiAction()
  const [insightResult, setInsightResult] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string>('board-insights')

  const hasApiKey = settings.apiKey.trim() !== '' || settings.aiProvider === 'ollama'

  const handleGenerateInsight = () => {
    aiAction.mutate(
      { action: selectedAction, cardId: 'global' },
      { onSuccess: (res) => setInsightResult(res.content) }
    )
  }

  if (!hasApiKey) {
    return (
      <div className="page insights-page">
        <h1 className="page-title">🤖 Insights por IA</h1>
        <section className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>🔑</p>
          <h2 className="section-title" style={{ textTransform: 'none', fontSize: '1rem' }}>
            Configure sua API Key
          </h2>
          <p className="loading-text" style={{ marginBottom: 16 }}>
            Para gerar insights com IA, configure sua chave de API nas configurações.
          </p>
          <a href="/settings" className="btn btn-primary">
            Ir para Configurações
          </a>
        </section>
      </div>
    )
  }

  return (
    <div className="page insights-page">
      <h1 className="page-title">🤖 Insights por IA</h1>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 className="section-title">Gerar Insights</h2>
        <p className="settings-hint" style={{ marginBottom: 16 }}>
          Gere insights baseados nos cards marcados como "Gerar insights" (🤖 ativado no card).
          Apenas cards com a flag habilitada serão analisados para economizar tokens.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="select"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            aria-label="Tipo de insight"
          >
            <option value="board-insights">📊 Visão geral do board</option>
            <option value="bottlenecks">🚧 Identificar gargalos</option>
            <option value="priorities">🎯 Sugerir prioridades</option>
            <option value="risks">⚠️ Análise de riscos</option>
            <option value="sprint-review">📋 Sprint review</option>
          </select>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateInsight}
            disabled={aiAction.isPending}
          >
            {aiAction.isPending ? '⏳ Gerando…' : '✨ Gerar insight'}
          </button>
        </div>
        <p className="settings-hint" style={{ marginTop: 8 }}>
          Provedor: {settings.aiProvider} • Modelo: {settings.aiModel}
        </p>
      </section>

      {aiAction.isPending && (
        <section className="card">
          <div className="ai-loading">
            <div className="ai-loading-spinner" />
            <span>Gerando insights com IA…</span>
          </div>
        </section>
      )}

      {insightResult && !aiAction.isPending && (
        <section className="card">
          <h2 className="section-title">Resultado</h2>
          <div className="ai-result">
            <MarkdownWithCode>{insightResult}</MarkdownWithCode>
          </div>
        </section>
      )}
    </div>
  )
}
