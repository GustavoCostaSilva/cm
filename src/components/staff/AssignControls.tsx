'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const SEL =
  'w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50'

export function AssignControls({
  clientId,
  attorneyId,
  assignedTo,
  attorneys,
  managers,
  canAssignManager,
}: {
  clientId: string
  attorneyId: string | null
  assignedTo: string | null
  attorneys: { id: string; name: string }[]
  managers: { id: string; name: string }[]
  canAssignManager: boolean
}) {
  const router = useRouter()
  const [att, setAtt] = useState(attorneyId ?? '')
  const [mgr, setMgr] = useState(assignedTo ?? '')
  const [busy, setBusy] = useState(false)

  async function patch(body: Record<string, unknown>, apply: () => void) {
    setBusy(true)
    try {
      const r = await fetch(`/api/staff/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (r.ok) {
        apply()
        toast.success('Atualizado.')
        router.refresh()
      } else {
        const d = await r.json().catch(() => ({}))
        toast.error(d.error || 'Erro ao atualizar.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Advogado responsável</label>
        <select
          value={att}
          disabled={busy}
          onChange={(e) => patch({ attorneyId: e.target.value }, () => setAtt(e.target.value))}
          className={SEL}
        >
          <option value="">Não definido</option>
          {attorneys.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Case Manager responsável</label>
        <select
          value={mgr}
          disabled={busy || !canAssignManager}
          onChange={(e) => patch({ assignedTo: e.target.value }, () => setMgr(e.target.value))}
          className={SEL}
        >
          <option value="">Não atribuído</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {!canAssignManager && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Apenas o coordenador altera o case manager.
          </p>
        )}
      </div>
    </div>
  )
}
