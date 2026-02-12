import { useState } from 'react'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import { usePerCardInsights, InsightsDropdown } from '@/features/ai'
import { useSettings, getActiveProvider, getModelLabel } from '@/features/settings'
import type { CardInsightResult } from '@/shared/types'

export function InsightsPage() {
  const { settings } = useSettings()
  const activeProvider = getActiveProvider(settings)
  const perCardInsights = usePerCardInsights()
  const [insights, setInsights] = useState<CardInsightResult[]>([])
  const [totalDuration, setTotalDuration] = useState<number | null>(null)
  const [selectedAction, setSelectedAction] = useState<string>('board-insights')

  const hasApiKey = activeProvider !== null

  const handleGenerateInsight = () => {
    perCardInsights.mutate(selectedAction, {
      onSuccess: (res) => {
        setInsights(res.insights)
        setTotalDuration(res.totalDurationMs)
      },
    })
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

  const statusLabel = (s: string) => {
    switch (s) {
      case 'Todo': return '📋 To Do'
      case 'InProgress': return '🔧 In Progress'
      case 'Done': return '✅ Done'
      default: return s
    }
  }

  return (
    <div className="page insights-page">
      <h1 className="page-title">🤖 Insights por IA</h1>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 className="section-title">Gerar Insights</h2>
        <p className="settings-hint" style={{ marginBottom: 16 }}>
          Gere insights individuais para cada card com 🤖 IA habilitada.
          Apenas cards com a flag ativada serão analisados.
        </p>
        <div className="insights-select-wrap">
          <InsightsDropdown
            value={selectedAction}
            onChange={setSelectedAction}
            disabled={perCardInsights.isPending}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleGenerateInsight}
            disabled={perCardInsights.isPending}
          >
            {perCardInsights.isPending ? '⏳ Gerando…' : '✨ Gerar insights'}
          </button>
        </div>
        <p className="settings-hint" style={{ marginTop: 8 }}>
          {activeProvider
            ? `Provedor: ${activeProvider.provider} • Modelo: ${getModelLabel(activeProvider.model)}`
            : 'Nenhum provedor ativo'}
        </p>
      </section>

      {perCardInsights.isPending && (
        <section className="card">
          <div className="ai-loading">
            <div className="ai-loading-spinner" />
            <span>Gerando insights individuais por card…</span>
          </div>
        </section>
      )}

      {insights.length > 0 && !perCardInsights.isPending && (
        <>
          <div className="insights-summary">
            <span>{insights.length} card(s) analisado(s)</span>
            {totalDuration !== null && (
              <span className="insights-duration">
                ⏱ {(totalDuration / 1000).toFixed(1)}s total
              </span>
            )}
          </div>

          <div className="insights-grid">
            {insights.map((insight) => (
              <section key={insight.cardId} className="card insights-card">
                <div className="insights-card-header">
                  <h3 className="insights-card-title">{insight.cardTitle}</h3>
                  <span className={`insights-card-status status-${insight.status.toLowerCase()}`}>
                    {statusLabel(insight.status)}
                  </span>
                </div>
                <div className="insights-card-body ai-result">
                  <MarkdownWithCode>{insight.content}</MarkdownWithCode>
                </div>
                <div className="insights-card-footer">
                  <span className="insights-card-provider">{insight.provider}</span>
                  <span className="insights-card-duration">
                    {(insight.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {insights.length === 0 && !perCardInsights.isPending && perCardInsights.isSuccess && (
        <section className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🤖</p>
          <p className="loading-text">
            Nenhum card com IA habilitada encontrado. Ative a flag 🤖 nos cards que deseja analisar.
          </p>
        </section>
      )}
    </div>
  )
}
