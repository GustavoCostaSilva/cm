'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ELIGIBILITY_LABELS, type ClientStatus, type Eligibility } from '@/types'

const SEL =
  'w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50'

export function CaseControls({
  clientId,
  status,
  eligibility,
  urgent,
}: {
  clientId: string
  status: ClientStatus
  eligibility: Eligibility
  urgent: boolean
}) {
  const router = useRouter()
  const [st, setSt] = useState<ClientStatus>(status)
  const [el, setEl] = useState<Eligibility>(eligibility)
  const [urg, setUrg] = useState(urgent)
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
        toast.error('Erro ao atualizar.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
        <select
          value={st}
          disabled={busy}
          onChange={(e) => patch({ status: e.target.value }, () => setSt(e.target.value as ClientStatus))}
          className={SEL}
        >
          <option value="active">Em andamento</option>
          <option value="paused">Pausado</option>
          <option value="closed">Concluído</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Elegibilidade</label>
        <select
          value={el}
          disabled={busy}
          onChange={(e) => patch({ eligibility: e.target.value }, () => setEl(e.target.value as Eligibility))}
          className={SEL}
        >
          <option value="pending">{ELIGIBILITY_LABELS.pending}</option>
          <option value="eligible">{ELIGIBILITY_LABELS.eligible}</option>
          <option value="ineligible">{ELIGIBILITY_LABELS.ineligible}</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={urg}
          disabled={busy}
          onChange={(e) => patch({ urgent: e.target.checked }, () => setUrg(e.target.checked))}
          className="size-4 accent-[#b22234]"
        />
        Caso urgente
      </label>
    </div>
  )
}
