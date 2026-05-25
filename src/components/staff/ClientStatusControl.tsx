'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { ClientStatus } from '@/types'

export function ClientStatusControl({
  clientId,
  status,
}: {
  clientId: string
  status: ClientStatus
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function change(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: value }),
      })
      if (res.ok) {
        toast.success('Status atualizado.')
        router.refresh()
      } else toast.error('Erro ao atualizar status.')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <select
      defaultValue={status}
      onChange={change}
      disabled={busy}
      className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
    >
      <option value="active">Em andamento</option>
      <option value="paused">Pausado</option>
      <option value="closed">Concluído</option>
    </select>
  )
}
