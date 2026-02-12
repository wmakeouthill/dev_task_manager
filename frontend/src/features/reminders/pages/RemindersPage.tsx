import { useState } from 'react'
import { useReminders, useCreateReminder, useCancelReminder, useSnoozeReminder, useCompleteReminder, useUpdateReminder, useDeleteReminder } from '@/features/reminders'
import { useSettings } from '@/features/settings/hooks/useSettings'
import type { NotificationMode, ToastPosition } from '@/features/settings/types/settings.types'
import type { ReminderData } from '@/shared/types'

export function RemindersPage() {
  const { data: remindersData, isLoading } = useReminders()
  const createReminder = useCreateReminder()
  const cancelReminder = useCancelReminder()
  const snoozeReminder = useSnoozeReminder()
  const completeReminder = useCompleteReminder()
  const updateReminder = useUpdateReminder()
  const deleteReminder = useDeleteReminder()
  const { settings, updateSettings } = useSettings()

  const [titulo, setTitulo] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')
  const [descricao, setDescricao] = useState('')

  // Estado do modal de edição
  const [editing, setEditing] = useState<ReminderData | null>(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editDescricao, setEditDescricao] = useState('')
  const [editScheduleAt, setEditScheduleAt] = useState('')

  const reminders = remindersData?.content ?? []

  const notificationMode = settings.notificationMode ?? 'both'
  const toastPosition = settings.toastPosition ?? 'top-right'

  const handleNotificationModeChange = (mode: NotificationMode) => {
    updateSettings({ notificationMode: mode })
  }

  const handleToastPositionChange = (pos: ToastPosition) => {
    updateSettings({ toastPosition: pos })
  }

  const handleCreate = (e: React.SyntheticEvent<HTMLFormElement>) => {
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

  const handleSnooze = (id: string, minutes: number) => {
    const until = new Date(Date.now() + minutes * 60_000).toISOString()
    snoozeReminder.mutate({ id, until })
  }

  const openEdit = (r: ReminderData) => {
    setEditing(r)
    setEditTitulo(r.titulo)
    setEditDescricao(r.descricao ?? '')
    // Converte ISO para datetime-local format
    setEditScheduleAt(new Date(r.scheduleAt).toISOString().slice(0, 16))
  }

  const handleUpdate = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editing || !editTitulo.trim()) return
    updateReminder.mutate(
      {
        id: editing.id,
        titulo: editTitulo.trim(),
        descricao: editDescricao.trim() || undefined,
        scheduleAt: new Date(editScheduleAt).toISOString(),
      },
      { onSuccess: () => setEditing(null) }
    )
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'Pending': return '⏳ Pendente'
      case 'Triggered': return '🔔 Disparado'
      case 'Cancelled': return '✕ Cancelado'
      case 'Completed': return '✓ Concluído'
      default: return status
    }
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

      {/* Configuração de notificações */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2 className="section-title">⚙️ Notificações</h2>
        <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Escolha onde os lembretes devem aparecer:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="notification-mode-option" aria-label="Ambos: notificação nativa e toast" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="notificationMode"
              value="both"
              checked={notificationMode === 'both'}
              onChange={() => handleNotificationModeChange('both')}
            />
            <span>
              <strong>Ambos</strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                — Notificação nativa do Windows + toast dentro do app
              </span>
            </span>
          </label>
          <label className="notification-mode-option" aria-label="Apenas notificação nativa do Windows" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="notificationMode"
              value="native"
              checked={notificationMode === 'native'}
              onChange={() => handleNotificationModeChange('native')}
            />
            <span>
              <strong>Apenas nativa (Windows)</strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                — Notificação global do Windows, visível mesmo fora do app
              </span>
            </span>
          </label>
          <label className="notification-mode-option" aria-label="Apenas toast dentro do app" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="radio"
              name="notificationMode"
              value="in-app"
              checked={notificationMode === 'in-app'}
              onChange={() => handleNotificationModeChange('in-app')}
            />
            <span>
              <strong>Apenas dentro do app</strong>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                — Toast interno, apenas visível quando o app está aberto
              </span>
            </span>
          </label>
        </div>

        {/* Posição do toast in-app */}
        {(notificationMode === 'in-app' || notificationMode === 'both') && (
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Posição do toast na tela:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {([
                { value: 'top-right' as const, label: '↗ Superior direito' },
                { value: 'top-left' as const, label: '↖ Superior esquerdo' },
                { value: 'bottom-right' as const, label: '↘ Inferior direito' },
                { value: 'bottom-left' as const, label: '↙ Inferior esquerdo' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`btn btn-sm ${toastPosition === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => handleToastPositionChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

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

      {/* Modal de edição */}
      {editing && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <dialog
          className="modal-overlay"
          open
          onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null) }}
          onClick={() => setEditing(null)}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, width: '100%' }}>
            <h2 className="section-title">✏️ Editar lembrete</h2>
            <form onSubmit={handleUpdate}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  className="input"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  placeholder="Título"
                  required
                />
                <input
                  className="input"
                  type="datetime-local"
                  value={editScheduleAt}
                  onChange={(e) => setEditScheduleAt(e.target.value)}
                  required
                />
                <textarea
                  className="input"
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  placeholder="Descrição (opcional)"
                  rows={2}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updateReminder.isPending}>
                    {updateReminder.isPending ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}

      <section>
        {reminders.length === 0 ? (
          <p className="loading-text">Nenhum lembrete ainda.</p>
        ) : (
          <ul className="card-list" style={{ listStyle: 'none', padding: 0 }}>
            {reminders.map((r) => (
              <li key={r.id} className="card" style={{ marginBottom: 8, opacity: r.status === 'Cancelled' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ textDecoration: r.status === 'Completed' ? 'line-through' : 'none' }}>
                      {r.titulo}
                    </strong>
                    {r.descricao && <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{r.descricao}</p>}
                    <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      📅 {new Date(r.scheduleAt).toLocaleString('pt-BR')}
                      {r.recurrence !== 'None' && ` • 🔄 ${r.recurrence}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`status-badge status-${r.status.toLowerCase()}`}>
                      {statusLabel(r.status)}
                    </span>

                    {/* Ações para lembretes pendentes/disparados */}
                    {(r.status === 'Pending' || r.status === 'Triggered') && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => completeReminder.mutate(r.id)}
                          title="Marcar como concluído"
                        >
                          ✓ Concluir
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleSnooze(r.id, 5)} title="Adiar 5 min">
                          ⏰ 5m
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleSnooze(r.id, 10)} title="Adiar 10 min">
                          ⏰ 10m
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleSnooze(r.id, 30)} title="Adiar 30 min">
                          ⏰ 30m
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => cancelReminder.mutate(r.id)}
                          title="Cancelar lembrete"
                        >
                          ✕ Cancelar
                        </button>
                      </>
                    )}

                    {/* Editar — disponível em qualquer status */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEdit(r)}
                      title="Editar lembrete"
                    >
                      ✏️
                    </button>

                    {/* Excluir permanentemente */}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-danger"
                      onClick={() => deleteReminder.mutate(r.id)}
                      title="Excluir permanentemente"
                    >
                      🗑️
                    </button>
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
