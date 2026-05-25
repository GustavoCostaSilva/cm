'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import type { Deadline, StageKey } from '@/types'
import { STAGE_KEYS, STAGE_LABELS } from '@/types'
import { formatDate, daysUntil } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

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
  const [busy, setBusy] = useState(false)

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
        body: JSON.stringify({ title, dueDate, stageKey: stageKey || null }),
      })
      if (res.ok) {
        toast.success('Prazo adicionado.')
        setTitle('')
        setDueDate('')
        setStageKey('')
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
      <ul className="space-y-2">
        {deadlines.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum prazo cadastrado.</li>
        )}
        {deadlines.map((dl) => {
          const done = dl.status === 'done'
          const d = daysUntil(dl.dueDate)
          const overdue = !done && d < 0
          return (
            <li key={dl.id} className="flex items-start gap-2.5">
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
                <p className={cn('text-xs', overdue ? 'text-destructive' : 'text-muted-foreground')}>
                  {formatDate(dl.dueDate)}
                  {!done && (overdue ? ` · vencido há ${Math.abs(d)}d` : d === 0 ? ' · hoje' : ` · em ${d}d`)}
                  {dl.stageKey ? ` · ${STAGE_LABELS[dl.stageKey]}` : ''}
                </p>
              </div>
              <button
                onClick={() => remove(dl.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Remover prazo"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Novo prazo (ex.: Enviar documentos)"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <select
            value={stageKey}
            onChange={(e) => setStageKey(e.target.value as StageKey | '')}
            className="rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Geral</option>
            {STAGE_KEYS.map((k) => (
              <option key={k} value={k}>
                {STAGE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
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
