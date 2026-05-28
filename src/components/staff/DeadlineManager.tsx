'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Pencil, Check, X } from 'lucide-react'
import type { Deadline, StageKey } from '@/types'
import { STAGE_KEYS, STAGE_LABELS, STAGE_SLA_HOURS, STAGE_DEADLINE_SUGGESTIONS } from '@/types'
import { formatDate, daysUntil } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

// Today + N days as a YYYY-MM-DD string in local time (for the date input).
function addDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DeadlineManager({
  clientId,
  deadlines,
}: {
  clientId: string
  deadlines: Deadline[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [stageKey, setStageKey] = useState<StageKey | ''>('')
  const [notify, setNotify] = useState(false)
  const [busy, setBusy] = useState(false)
  // Track whether title/date were auto-filled from a stage suggestion, so
  // changing the stage updates them but a manual edit is never overwritten.
  const [titleAuto, setTitleAuto] = useState(false)
  const [dateAuto, setDateAuto] = useState(false)

  function onStageChange(k: StageKey | '') {
    setStageKey(k)
    if (!k) return
    if (!title.trim() || titleAuto) {
      setTitle(STAGE_DEADLINE_SUGGESTIONS[k])
      setTitleAuto(true)
    }
    if (!dueDate || dateAuto) {
      const hrs = STAGE_SLA_HOURS[k]?.normal ?? 0
      if (hrs > 0) {
        setDueDate(addDaysISO(Math.max(1, Math.ceil(hrs / 24))))
        setDateAuto(true)
      }
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editBusy, setEditBusy] = useState(false)

  // Pending first (earliest due first), completed sink to the bottom.
  const sorted = [...deadlines].sort((a, b) => {
    const ad = a.status === 'done' ? 1 : 0
    const bd = b.status === 'done' ? 1 : 0
    if (ad !== bd) return ad - bd
    return a.dueDate.localeCompare(b.dueDate)
  })
  const pending = deadlines.filter((d) => d.status !== 'done')
  const overdueCount = pending.filter((d) => daysUntil(d.dueDate) < 0).length

  async function add() {
    if (!title.trim() || !dueDate) {
      toast.error('Informe título e data.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueDate, stageKey: stageKey || null, notify }),
      })
      if (res.ok) {
        const d = await res.json().catch(() => ({}))
        const note = d.mail?.dev
          ? ' (e-mail simulado no console)'
          : notify && d.mail?.delivered
            ? ' e cliente notificado'
            : ''
        toast.success('Prazo adicionado' + note + '.')
        setTitle('')
        setDueDate('')
        setStageKey('')
        setNotify(false)
        setTitleAuto(false)
        setDateAuto(false)
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erro ao adicionar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(dl: Deadline) {
    const res = await fetch(`/api/staff/clients/${clientId}/deadlines`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deadlineId: dl.id,
        status: dl.status === 'done' ? 'pending' : 'done',
      }),
    })
    if (res.ok) router.refresh()
    else toast.error('Erro ao atualizar.')
  }

  function startEdit(dl: Deadline) {
    setEditingId(dl.id)
    setEditTitle(dl.title)
    setEditDate(dl.dueDate)
  }
  function cancelEdit() {
    setEditingId(null)
    setEditTitle('')
    setEditDate('')
  }
  async function saveEdit(dl: Deadline) {
    if (!editTitle.trim() || !editDate) {
      toast.error('Informe título e data.')
      return
    }
    setEditBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}/deadlines`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadlineId: dl.id, title: editTitle, dueDate: editDate }),
      })
      if (res.ok) {
        toast.success('Prazo atualizado.')
        cancelEdit()
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erro ao atualizar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setEditBusy(false)
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/staff/clients/${clientId}/deadlines?deadline_id=${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      toast.success('Prazo removido.')
      router.refresh()
    } else toast.error('Erro ao remover.')
  }

  return (
    <div>
      {pending.length > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">
          {pending.length} {pending.length === 1 ? 'pendente' : 'pendentes'}
          {overdueCount > 0 && (
            <span className="font-medium text-destructive"> · {overdueCount} vencido{overdueCount > 1 ? 's' : ''}</span>
          )}
        </p>
      )}

      <ul className="space-y-2">
        {deadlines.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum prazo cadastrado.</li>
        )}
        {sorted.map((dl) => {
          const done = dl.status === 'done'
          const d = daysUntil(dl.dueDate)
          const overdue = !done && d < 0
          const dueSoon = !done && d >= 0 && d <= 3

          if (editingId === dl.id) {
            return (
              <li key={dl.id} className="space-y-2 rounded-lg border border-border bg-secondary/40 p-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <button
                    onClick={() => saveEdit(dl)}
                    disabled={editBusy}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {editBusy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Salvar
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Cancelar"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            )
          }

          return (
            <li
              key={dl.id}
              className={cn(
                'group flex items-start gap-2.5 rounded-lg border-l-2 py-1 pl-2.5',
                done
                  ? 'border-l-transparent'
                  : overdue
                    ? 'border-l-destructive'
                    : dueSoon
                      ? 'border-l-[#c9a227]'
                      : 'border-l-transparent',
              )}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggle(dl)}
                className="mt-1 size-4 accent-[#1b3a6b]"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm',
                    done ? 'text-muted-foreground line-through' : 'text-foreground',
                  )}
                >
                  {dl.title}
                </p>
                <p
                  className={cn(
                    'text-xs',
                    overdue ? 'text-destructive' : dueSoon ? 'text-[#8a6d0f]' : 'text-muted-foreground',
                  )}
                >
                  {formatDate(dl.dueDate)}
                  {!done && (overdue ? ` · vencido há ${Math.abs(d)}d` : d === 0 ? ' · hoje' : d === 1 ? ' · amanhã' : ` · em ${d}d`)}
                  {dl.stageKey ? ` · ${STAGE_LABELS[dl.stageKey]}` : ''}
                </p>
              </div>
              <div className="flex items-center opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => startEdit(dl)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Editar prazo"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => remove(dl.id)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remover prazo"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <select
          value={stageKey}
          onChange={(e) => onStageChange(e.target.value as StageKey | '')}
          className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">Etapa (preenche uma sugestão)…</option>
          {STAGE_KEYS.map((k) => (
            <option key={k} value={k}>
              {STAGE_LABELS[k]}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setTitleAuto(false)
          }}
          placeholder="Novo prazo (ex.: Enviar documentos)"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => {
            setDueDate(e.target.value)
            setDateAuto(false)
          }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <label className="flex items-center gap-1.5 text-xs text-foreground">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="size-3.5 accent-[#1b3a6b]"
          />
          Avisar o cliente por e-mail
        </label>
        <button
          onClick={add}
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Adicionar prazo
        </button>
      </div>
    </div>
  )
}
