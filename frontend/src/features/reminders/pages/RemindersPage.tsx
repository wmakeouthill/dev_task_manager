import { useState, type FormEvent } from 'react'
import { useReminders, useCreateReminder, useCancelReminder, useSnoozeReminder } from '@/features/reminders'

export function RemindersPage() {
  const { data: remindersData, isLoading } = useReminders()
  const createReminder = useCreateReminder()
  const cancelReminder = useCancelReminder()
  const snoozeReminder = useSnoozeReminder()

  const [titulo, setTitulo] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [descricao, setDescricao] = useState('')

  const reminders = remindersData?.content ?? []

  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!titulo.trim() || !scheduleAt) return
    createReminder.mutate(
      { titulo: titulo.trim(), scheduleAt: new Date(scheduleAt).toISOString(), descricao: descricao.trim() || undefined },
      {
        onSuccess: () => {
          setTitulo('')
          setScheduleAt('')
          setDescricao('')
        },
      }
    )
  }

  const handleSnooze = (id: string) => {
    const until = new Date(Date.now() + 30 * 60_000).toISOString() // +30 min
    snoozeReminder.mutate({ id, until })
  }

  if (isLoading) {
    return (
      <div className="page">
        <h1 className="page-title">🔔 Lembretes</h1>
        <p className="loading-text">Carregando…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">🔔 Lembretes</h1>

      <section className="card" style={{ marginBottom: 24 }}>
        <h2 className="section-title">Novo lembrete</h2>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              className="input"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título do lembrete"
              required
            />
            <input
              className="input"
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              required
            />
            <textarea
              className="input"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição (opcional)"
              rows={2}
            />
            <button type="submit" className="btn btn-primary" disabled={createReminder.isPending}>
              {createReminder.isPending ? 'Criando…' : 'Criar lembrete'}
            </button>
          </div>
        </form>
      </section>

      <section>
        {reminders.length === 0 ? (
          <p className="loading-text">Nenhum lembrete ainda.</p>
        ) : (
          <ul className="card-list" style={{ listStyle: 'none', padding: 0 }}>
            {reminders.map((r) => (
              <li key={r.id} className="card" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <strong>{r.titulo}</strong>
                    {r.descricao && <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r.descricao}</p>}
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      📅 {new Date(r.scheduleAt).toLocaleString('pt-BR')}
                      {r.recurrence !== 'None' && ` • 🔄 ${r.recurrence}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span className={`status-badge status-${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                    {r.status === 'Pending' && (
                      <>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleSnooze(r.id)}>
                          ⏰ +30m
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => cancelReminder.mutate(r.id)}>
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
