import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard, useCurrentUser } from '@/features/dashboard'
import { useReminders } from '@/features/reminders'
import { useAiAction } from '@/features/ai'
import { MarkdownWithCode } from '@/shared/components/MarkdownWithCode'
import { CardPreviewModal } from '@/shared/components/CardPreviewModal'

const RECENT_CARDS_PAGE_SIZE = 5

const DAILY_INSIGHT_KEY = 'devtaskmanager:daily-insight'
const DAILY_INSIGHT_TTL = 24 * 60 * 60 * 1000 // 1 dia

interface CachedInsight {
  content: string
  timestamp: number
}

function getCachedDailyInsight(): string | null {
  try {
    const raw = localStorage.getItem(DAILY_INSIGHT_KEY)
    if (!raw) return null
    const cached: CachedInsight = JSON.parse(raw)
    if (Date.now() - cached.timestamp > DAILY_INSIGHT_TTL) {
      localStorage.removeItem(DAILY_INSIGHT_KEY)
      return null
    }
    return cached.content
  } catch {
    return null
  }
}

function saveDailyInsight(content: string) {
  const cached: CachedInsight = { content, timestamp: Date.now() }
  localStorage.setItem(DAILY_INSIGHT_KEY, JSON.stringify(cached))
}

export function HomePage() {
  const navigate = useNavigate()
  const { data: dashboard, isLoading } = useDashboard()
  const { data: user } = useCurrentUser()
  const { data: remindersData } = useReminders()
  const aiAction = useAiAction()
  const [dailyInsight, setDailyInsight] = useState<string | null>(null)
  const [previewCardId, setPreviewCardId] = useState<string | null>(null)
  const [recentPage, setRecentPage] = useState(1)

  // Carregar insight do cache local ao montar
  useEffect(() => {
    const cached = getCachedDailyInsight()
    if (cached) setDailyInsight(cached)
  }, [])

  const reminders = remindersData?.content?.filter((r) => r.status === 'Pending') ?? []
  const greeting = getGreeting()

  if (isLoading) {
    return (
      <div className="page home-page">
        <div className="skeleton" style={{ height: 32, width: 300, marginBottom: 24 }} />
        <div className="home-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page home-page">
      <header className="home-header">
        <div className="home-user">
          {user?.avatarBase64 ? (
            <img
              src={`data:image/png;base64,${user.avatarBase64}`}
              alt={user.displayName}
              className="home-avatar"
            />
          ) : (
            <div className="home-avatar home-avatar-placeholder">
              {(user?.displayName ?? 'D')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="home-greeting">
              {greeting}, {user?.displayName ?? 'Dev'}! 👋
            </h1>
            <p className="home-subtitle">
              Aqui está o resumo do seu dia
            </p>
          </div>
        </div>
      </header>

      {/* Stats cards */}
      <div className="home-stats">
        <button type="button" className="stat-card" onClick={() => navigate('/boards')}>
          <span className="stat-value">{dashboard?.totalCards ?? 0}</span>
          <span className="stat-label">Total Cards</span>
        </button>
        <div className="stat-card stat-todo">
          <span className="stat-value">{dashboard?.cardsTodo ?? 0}</span>
          <span className="stat-label">📋 To Do</span>
        </div>
        <div className="stat-card stat-progress">
          <span className="stat-value">{dashboard?.cardsInProgress ?? 0}</span>
          <span className="stat-label">🔧 In Progress</span>
        </div>
        <div className="stat-card stat-done">
          <span className="stat-value">{dashboard?.cardsDone ?? 0}</span>
          <span className="stat-label">✅ Done</span>
        </div>
        {(dashboard?.cardsOverdue ?? 0) > 0 && (
          <div className="stat-card stat-overdue">
            <span className="stat-value">{dashboard?.cardsOverdue}</span>
            <span className="stat-label">⚠️ Atrasados</span>
          </div>
        )}
      </div>

      <div className="home-grid">
        {/* AI Insights — col 1, row 1 */}
        <section className="card home-section home-section-insights">
          <h2 className="section-title">🤖 Insights do dia</h2>
          <div className="home-insights">
            {dashboard && dashboard.totalCards > 0 ? (
              <>
                {dashboard.cardsInProgress > 0 && (
                  <p className="insight-item">
                    💡 Você tem <strong>{dashboard.cardsInProgress}</strong> card(s) em progresso.
                    Foque em finalizá-los antes de começar novos.
                  </p>
                )}
                {dashboard.cardsOverdue > 0 && (
                  <p className="insight-item insight-warning">
                    ⚠️ <strong>{dashboard.cardsOverdue}</strong> card(s) atrasado(s)!
                    Revise as prioridades.
                  </p>
                )}
                {dashboard.cardsTodo > 5 && (
                  <p className="insight-item">
                    📊 Backlog com <strong>{dashboard.cardsTodo}</strong> cards.
                    Considere priorizar e quebrar tarefas grandes.
                  </p>
                )}
                {dashboard.cardsDone > 0 && (
                  <p className="insight-item insight-success">
                    🎉 <strong>{dashboard.cardsDone}</strong> card(s) concluído(s). Ótimo trabalho!
                  </p>
                )}
                {dashboard.totalCards > 0 && (
                  <div className="insight-progress">
                    <div className="insight-progress-bar">
                      <div
                        className="insight-progress-fill"
                        style={{
                          width: `${Math.round(
                            (dashboard.cardsDone / dashboard.totalCards) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="insight-progress-text">
                      {Math.round((dashboard.cardsDone / dashboard.totalCards) * 100)}% completo
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="insight-item">
                🚀 Nenhum card ainda. Acesse <strong>Boards</strong> para criar seu primeiro!
              </p>
            )}
          </div>
        </section>

        {/* Recent cards — col 3, sozinho */}
        <section className="card home-section home-section-recentes">
          <h2 className="section-title">🕐 Cards recentes</h2>
          {dashboard?.recentCards?.length ? (
            <>
              <ul className="home-card-list">
                {dashboard.recentCards
                  .slice((recentPage - 1) * RECENT_CARDS_PAGE_SIZE, recentPage * RECENT_CARDS_PAGE_SIZE)
                  .map((card) => (
                  <li key={card.id} className="home-card-item">
                    <button
                      type="button"
                      className="home-card-item-btn"
                      onClick={() => setPreviewCardId(card.id)}
                    >
                      <span className={`status-dot status-${card.status.toLowerCase()}`} />
                      <div className="home-card-info">
                        <span className="home-card-title">{card.titulo}</span>
                        <span className="home-card-meta">
                          {card.status} • {new Date(card.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {dashboard.recentCards.length > RECENT_CARDS_PAGE_SIZE && (
                <div className="home-pagination">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={recentPage <= 1}
                    onClick={() => setRecentPage((p) => p - 1)}
                  >
                    ← Anterior
                  </button>
                  <span className="home-pagination-info">
                    {recentPage} / {Math.ceil(dashboard.recentCards.length / RECENT_CARDS_PAGE_SIZE)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={recentPage >= Math.ceil(dashboard.recentCards.length / RECENT_CARDS_PAGE_SIZE)}
                    onClick={() => setRecentPage((p) => p + 1)}
                  >
                    Próximo →
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="loading-text">Nenhum card recente.</p>
          )}
        </section>

        {/* Overdue cards — col 1, row 2 */}
        <section
          className={`card home-section home-section-atrasados ${
            (dashboard?.overdueCards?.length ?? 0) > 0 ? 'home-section-warning' : ''
          }`}
        >
          <h2 className="section-title">⚠️ Cards atrasados</h2>
          {(dashboard?.overdueCards?.length ?? 0) > 0 ? (
            <div className="home-overdue-scroll">
              <ul className="home-card-list">
                {dashboard!.overdueCards.map((card) => (
                  <li key={card.id} className="home-card-item">
                    <button
                      type="button"
                      className="home-card-item-btn"
                      onClick={() => setPreviewCardId(card.id)}
                    >
                      <span className="status-dot status-overdue" />
                      <div className="home-card-info">
                        <span className="home-card-title">{card.titulo}</span>
                        <span className="home-card-meta">
                          Venceu em {new Date(card.dueDate!).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="loading-text">Nenhum card atrasado.</p>
          )}
        </section>

        {/* Pending reminders — col 2, row 1 */}
        <section className="card home-section home-section-lembretes">
          <h2 className="section-title">🔔 Lembretes pendentes</h2>
          {reminders.length > 0 ? (
            <ul className="home-card-list">
              {reminders.slice(0, 5).map((r) => (
                <li key={r.id} className="home-card-item">
                  <span className="status-dot status-pending" />
                  <div className="home-card-info">
                    <span className="home-card-title">{r.titulo}</span>
                    <span className="home-card-meta">
                      {new Date(r.scheduleAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="loading-text">Nenhum lembrete pendente.</p>
          )}
        </section>

        {/* Quick actions — col 2, row 2 */}
        <section className="card home-section home-section-acoes">
          <h2 className="section-title">⚡ Ações rápidas</h2>
          <div className="home-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/boards')}
            >
              📋 Ir para Boards
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/reminders')}
            >
              🔔 Lembretes
            </button>
          </div>
        </section>

        {/* AI Daily Insight */}
        <section className="card home-section home-section-ai-daily">
          <h2 className="section-title">🤖 Insight do Dia (IA)</h2>
          {dailyInsight ? (
            <div className="ai-result">
              <MarkdownWithCode>{dailyInsight}</MarkdownWithCode>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p className="loading-text" style={{ marginBottom: 12 }}>
                Gere um resumo inteligente do seu dia com base nos cards ativos.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={aiAction.isPending}
                onClick={() => {
                  aiAction.mutate(
                    { action: 'daily-insights', cardId: '00000000-0000-0000-0000-000000000000' },
                    {
                      onSuccess: (res) => {
                        setDailyInsight(res.content)
                        saveDailyInsight(res.content)
                      },
                    }
                  )
                }}
              >
                {aiAction.isPending ? '⏳ Gerando…' : '✨ Gerar insight do dia'}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Card Preview Modal */}
      {previewCardId && (
        <CardPreviewModal
          cardId={previewCardId}
          onClose={() => setPreviewCardId(null)}
        />
      )}
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}
