'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, X, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react'
import {
  SEVERITY_LABELS,
  MAX_REVIEW_ROUNDS,
  type CaseReview,
  type ErrorSeverity,
} from '@/types'
import { formatDateTime } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

const SEVERITY_CLS: Record<ErrorSeverity, string> = {
  critical: 'bg-destructive/10 text-destructive',
  moderate: 'bg-[#c9a227]/15 text-[#8a6d0f]',
  cosmetic: 'bg-secondary text-muted-foreground',
}

const SEVERITIES: ErrorSeverity[] = ['critical', 'moderate', 'cosmetic']

interface DraftError {
  severity: ErrorSeverity
  field: string
  note: string
}

export function ReviewPanel({
  clientId,
  reviews,
  canReview,
}: {
  clientId: string
  reviews: CaseReview[]
  canReview: boolean
}) {
  const router = useRouter()
  const [rows, setRows] = useState<DraftError[]>([])
  const [busy, setBusy] = useState(false)

  const returnsSoFar = reviews.filter((r) => r.outcome === 'returned').length
  const lastApproved = reviews.length > 0 && reviews[reviews.length - 1].outcome === 'approved'
  const escalated = returnsSoFar > MAX_REVIEW_ROUNDS
  const nextRound = reviews.length + 1

  const filled = rows.filter((r) => r.field.trim() || r.note.trim())
  const hasBlocking = filled.some((r) => r.severity === 'critical' || r.severity === 'moderate')

  function addRow() {
    setRows((r) => [...r, { severity: 'moderate', field: '', note: '' }])
  }
  function updateRow(i: number, patch: Partial<DraftError>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i))
  }

  async function submit(outcome: 'approved' | 'returned') {
    if (outcome === 'returned' && filled.length === 0) {
      toast.error('Liste ao menos um apontamento para devolver.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, errors: filled }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(
          outcome === 'approved'
            ? `Revisão aprovada (rodada ${d.round}).`
            : d.escalated
              ? 'Devolvido — caso escalado ao Coordenador.'
              : `Devolvido para correção (rodada ${d.round}).`,
        )
        setRows([])
        router.refresh()
      } else {
        toast.error(d.error || 'Erro ao registrar a revisão.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* status / escalation banner */}
      {escalated ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            {returnsSoFar}ª devolução registrada — caso <strong>escalado ao Coordenador</strong> para
            avaliação e possível reatribuição (§Etapa 7).
          </span>
        </div>
      ) : returnsSoFar === MAX_REVIEW_ROUNDS ? (
        <div className="flex items-start gap-2 rounded-lg border border-[#c9a227]/40 bg-[#c9a227]/10 px-3 py-2 text-sm text-[#8a6d0f]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            {returnsSoFar} de {MAX_REVIEW_ROUNDS} rodadas usadas — a próxima devolução escala o caso ao
            Coordenador (§Etapa 7).
          </span>
        </div>
      ) : lastApproved ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" />
          Revisão técnica aprovada.
        </div>
      ) : null}

      {/* history */}
      {reviews.length > 0 && (
        <ul className="space-y-2">
          {reviews.map((rv) => (
            <li key={rv.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Rodada {rv.round}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      rv.outcome === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-[#c9a227]/15 text-[#8a6d0f]',
                    )}
                  >
                    {rv.outcome === 'approved' ? 'Aprovado' : 'Devolvido'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {rv.reviewer} · {formatDateTime(rv.createdAt)}
                </span>
              </div>
              {rv.errors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {rv.errors.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span
                        className={cn(
                          'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                          SEVERITY_CLS[e.severity],
                        )}
                      >
                        {SEVERITY_LABELS[e.severity]}
                      </span>
                      <span className="text-foreground">
                        {e.field && <span className="font-medium">{e.field}: </span>}
                        <span className="text-muted-foreground">{e.note}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* new review form */}
      {canReview ? (
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Nova revisão — rodada {nextRound}</h3>
            <button
              onClick={addRow}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
            >
              <Plus className="size-3" /> Apontamento
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="mb-3 text-xs text-muted-foreground">
              Aprove se o processo está consistente, ou adicione apontamentos e devolva para correção.
              Não é possível aprovar com apontamento crítico ou moderado pendente (§10.1).
            </p>
          ) : (
            <ul className="mb-3 space-y-2">
              {rows.map((row, i) => (
                <li key={i} className="flex flex-wrap items-start gap-2 sm:flex-nowrap">
                  <select
                    value={row.severity}
                    onChange={(e) => updateRow(i, { severity: e.target.value as ErrorSeverity })}
                    className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {SEVERITY_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <input
                    value={row.field}
                    onChange={(e) => updateRow(i, { field: e.target.value })}
                    placeholder="Campo / formulário"
                    className="w-32 shrink-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={row.note}
                    onChange={(e) => updateRow(i, { note: e.target.value })}
                    placeholder="Descrição do erro"
                    className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => removeRow(i)}
                    className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive"
                    title="Remover"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => submit('approved')}
              disabled={busy || hasBlocking}
              title={hasBlocking ? 'Remova os apontamentos críticos/moderados para aprovar' : undefined}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Aprovar revisão
            </button>
            <button
              onClick={() => submit('returned')}
              disabled={busy || filled.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#c9a227]/50 bg-[#c9a227]/10 px-3 py-1.5 text-sm font-semibold text-[#8a6d0f] hover:bg-[#c9a227]/20 disabled:opacity-50"
            >
              <RotateCcw className="size-4" />
              Devolver para correção
            </button>
            {hasBlocking && (
              <span className="text-xs text-muted-foreground">
                Apontamento crítico/moderado → use “Devolver”.
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Somente o Revisor Técnico ou o Coordenador registra a revisão técnica.
        </p>
      )}
    </div>
  )
}
