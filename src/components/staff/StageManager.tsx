'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, Play, ChevronDown } from 'lucide-react'
import type { StageProgress, StageKey } from '@/types'
import { STAGE_LABELS, STAGE_DESCRIPTIONS, STAGE_RESPONSIBLE, ROLE_LABELS } from '@/types'
import { stageDurationLabel, formatDate, formatDateTime, slaState, slaDueDate, slaCountdown, slaMaxLabel } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

const SLA_BADGE: Record<'ok' | 'due_soon' | 'overdue', { label: string; cls: string }> = {
  ok: { label: 'SLA no prazo', cls: 'bg-emerald-100 text-emerald-700' },
  due_soon: { label: 'SLA vence em breve', cls: 'bg-[#c9a227]/15 text-[#8a6d0f]' },
  overdue: { label: 'SLA estourado', cls: 'bg-destructive/10 text-destructive' },
}

export function StageManager({
  clientId,
  stages,
  urgent,
  nowIso,
}: {
  clientId: string
  stages: StageProgress[]
  urgent: boolean
  nowIso: string
}) {
  const router = useRouter()
  const now = new Date(nowIso)
  const [openKey, setOpenKey] = useState<StageKey | null>(null)
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)

  async function post(action: string, stageKey: StageKey, extra: Record<string, unknown> = {}) {
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, stageKey, ...extra }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(d.error || 'Não foi possível atualizar a etapa.')
        return
      }
      const mailNote = d.mail?.dev
        ? ' — e-mail simulado no log (SMTP não configurado)'
        : d.notified
          ? ' — cliente notificado por e-mail'
          : ''
      toast.success((action === 'complete' ? 'Etapa concluída' : 'Etapa atualizada') + mailNote)
      setOpenKey(null)
      setNote('')
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ol className="space-y-3">
      {stages.map((s, i) => {
        const done = s.status === 'done'
        const active = s.status === 'active'
        const dur = stageDurationLabel(s, now)
        const isOpen = openKey === s.key
        const sla = active ? slaState(s, urgent, now) : null
        const dueDate = active ? slaDueDate(s, urgent) : null
        const countdown = active ? slaCountdown(s, urgent, now) : null
        const maxLabel = slaMaxLabel(s.key, urgent)
        return (
          <li
            key={s.key}
            className={cn(
              'rounded-xl border p-4 transition-colors',
              active ? 'border-[#c9a227]/40 bg-[#c9a227]/5' : 'border-border bg-card',
            )}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  done && 'bg-primary text-primary-foreground',
                  active && 'bg-[#c9a227] text-white',
                  !done && !active && 'bg-secondary text-muted-foreground',
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{STAGE_LABELS[s.key]}</h3>
                  <div className="flex items-center gap-2">
                    {sla && countdown && (
                      <span
                        className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', SLA_BADGE[sla].cls)}
                        title={`Prazo da etapa: ${maxLabel ?? '—'}`}
                      >
                        {countdown}
                      </span>
                    )}
                    {!done && !active && (
                      <button
                        onClick={() => post('start', s.key, { notify: false })}
                        disabled={busy}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                      >
                        <Play className="size-3" />
                        Iniciar
                      </button>
                    )}
                    {(active || (!done && i === 0)) && (
                      <button
                        onClick={() => setOpenKey(isOpen ? null : s.key)}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Concluir
                        <ChevronDown className={cn('size-3 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                    )}
                    {done && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Concluída
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{STAGE_DESCRIPTIONS[s.key]}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span>Responsável: {ROLE_LABELS[STAGE_RESPONSIBLE[s.key]]}</span>
                  {maxLabel && (
                    <span>
                      Prazo SLA: <span className="font-medium text-foreground">{maxLabel}</span>
                      {active && dueDate && ` · vence ${formatDateTime(dueDate.toISOString())}`}
                    </span>
                  )}
                  {s.startedAt && <span>Início: {formatDate(s.startedAt)}</span>}
                  {done && s.completedAt && <span>Conclusão: {formatDate(s.completedAt)}</span>}
                  {dur && (
                    <span className="font-medium text-foreground">
                      {done ? 'Durou' : 'Há'} {dur}
                    </span>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-3 rounded-lg border border-border bg-background p-3">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="O que foi feito nesta etapa? (opcional — enviado ao cliente se notificar)"
                      className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={notify}
                          onChange={(e) => setNotify(e.target.checked)}
                          className="size-3.5 accent-[#1b3a6b]"
                        />
                        Notificar cliente por e-mail
                      </label>
                      <button
                        onClick={() => post('complete', s.key, { message: note, notify })}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {busy && <Loader2 className="size-3.5 animate-spin" />}
                        Concluir etapa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
