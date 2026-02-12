import { useState } from 'react'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import {
  usePerCardInsights, useInsights, useSaveInsights, useDeleteInsight, useDeleteAllInsights,
  InsightsDropdown,
} from '@/features/ai'
import { useSettings, getActiveProvider, getModelLabel } from '@/features/settings'
import type { PersistedInsight } from '@/shared/types'

export function InsightsPage() {
  const { settings } = useSettings()
  const activeProvider = getActiveProvider(settings)
  const perCardInsights = usePerCardInsights()
  const { data: persistedInsights, isLoading: loadingPersisted } = useInsights()
  const saveInsights = useSaveInsights()
  const deleteInsight = useDeleteInsight()
  const deleteAllInsights = useDeleteAllInsights()
  const [selectedAction, setSelectedAction] = useState<string>('board-insights')
  const [lastDuration, setLastDuration] = useState<number | null>(null)

  const hasApiKey = activeProvider !== null
  const insights: PersistedInsight[] = persistedInsights ?? []

  const handleGenerateInsight = () => {
    perCardInsights.mutate(selectedAction, {
      onSuccess: (res) => {
        setLastDuration(res.totalDurationMs)
        // Persiste no banco automaticamente
        if (res.insights.length > 0) {
          saveInsights.mutate({
            action: selectedAction,
            insights: res.insights.map((i) => ({
              cardId: i.cardId,
              cardTitle: i.cardTitle,
              status: i.status,
              content: i.content,
              provider: i.provider,
              durationMs: i.durationMs,
            })),
            totalDurationMs: res.totalDurationMs,
          })
        }
      },
    })
  }

  const handleDismiss = (id: string) => {
    deleteInsight.mutate(id)
  }

  const handleDismissAll = () => {
    if (confirm('Remover todos os insights persistidos?')) {
      deleteAllInsights.mutate()
      setLastDuration(null)
    }
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
          Os insights são persistidos até você removê-los.
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
          {insights.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-danger"
              onClick={handleDismissAll}
              disabled={deleteAllInsights.isPending}
              title="Remover todos os insights"
            >
              🗑️ Limpar tudo
            </button>
          )}
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

      {!loadingPersisted && insights.length > 0 && !perCardInsights.isPending && (
        <>
          <div className="insights-summary">
            <span>{insights.length} insight(s) salvo(s)</span>
            {lastDuration !== null && (
              <span className="insights-duration">
                ⏱ {(lastDuration / 1000).toFixed(1)}s última geração
              </span>
            )}
          </div>

          <div className="insights-grid">
            {insights.map((insight) => (
              <section key={insight.id} className="card insights-card">
                <div className="insights-card-header">
                  <h3 className="insights-card-title">{insight.cardTitle}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`insights-card-status status-${insight.status.toLowerCase()}`}>
                      {statusLabel(insight.status)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleDismiss(insight.id)}
                      disabled={deleteInsight.isPending}
                      title="Remover insight"
                      aria-label={`Remover insight de ${insight.cardTitle}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="insights-card-body ai-result">
                  <MarkdownWithCode>{insight.content}</MarkdownWithCode>
                </div>
                <div className="insights-card-footer">
                  <span className="insights-card-provider">{insight.provider}</span>
                  <span className="insights-card-duration">
                    {(insight.durationMs / 1000).toFixed(1)}s
                  </span>
                  <span className="insights-card-date">
                    {new Date(insight.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      {!loadingPersisted && insights.length === 0 && !perCardInsights.isPending && (
        <section className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🤖</p>
          <p className="loading-text">
            Nenhum insight salvo. Gere insights para os cards com IA habilitada.
          </p>
        </section>
      )}
    </div>
  )
}
