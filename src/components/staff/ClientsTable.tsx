'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, daysUntil } from '@/lib/case-utils'
import { NewClientDialog } from './NewClientDialog'

export interface ClientRow {
  id: string
  fullName: string
  passport: string
  visa: string | null
  urgent: boolean
  eligibility: 'pending' | 'eligible' | 'ineligible'
  status: 'active' | 'paused' | 'closed'
  assignedToId: string | null
  assignedToName: string | null
  stageLabel: string
  progress: number
  nextDeadline: string | null
}

const STATUS = {
  active: { label: 'Em andamento', cls: 'bg-primary/10 text-primary' },
  paused: { label: 'Pausado', cls: 'bg-[#c9a227]/15 text-[#8a6d0f]' },
  closed: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-700' },
} as const

const ELIG = {
  pending: { label: 'Elegibilidade pendente', cls: 'bg-secondary text-muted-foreground' },
  eligible: { label: 'Elegível', cls: 'bg-emerald-100 text-emerald-700' },
  ineligible: { label: 'Inelegível', cls: 'bg-destructive/10 text-destructive' },
} as const

const FILTERS = [
  ['all', 'Todos'],
  ['active', 'Em andamento'],
  ['paused', 'Pausado'],
  ['closed', 'Concluído'],
] as const

function DeadlineCell({ due }: { due: string }) {
  const d = daysUntil(due)
  const tone = d < 0 ? 'text-destructive' : d <= 3 ? 'text-[#8a6d0f]' : 'text-foreground'
  const label = d < 0 ? 'Vencido' : d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : `Em ${d} dias`
  return (
    <div>
      <div className={cn('font-medium', tone)}>{label}</div>
      <div className="text-xs text-muted-foreground">{formatDate(due)}</div>
    </div>
  )
}

export function ClientsTable({
  rows,
  managers,
  canFilterManager,
}: {
  rows: ClientRow[]
  managers: { id: string; name: string }[]
  canFilterManager: boolean
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'paused' | 'closed'>('all')
  const [manager, setManager] = useState('all')
  const [urgentOnly, setUrgentOnly] = useState(false)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (manager !== 'all' && r.assignedToId !== manager) return false
      if (urgentOnly && !r.urgent) return false
      if (term && ![r.fullName, r.passport, r.visa ?? '', r.assignedToName ?? ''].some((v) => v.toLowerCase().includes(term)))
        return false
      return true
    })
  }, [rows, q, status, manager, urgentOnly])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">{rows.length} cliente(s)</p>
        </div>
        <NewClientDialog managers={managers} canAssign={canFilterManager} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, passaporte, visto, responsável..."
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
        {canFilterManager && managers.length > 0 && (
          <select
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="all">Todos os case managers</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setUrgentOnly((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            urgentOnly ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground hover:text-foreground',
          )}
        >
          <AlertTriangle className="size-4" />
          Urgentes
        </button>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(([val, label]) => (
            <button
              key={val}
              onClick={() => setStatus(val)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                status === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Visto</th>
                <th className="px-4 py-3 font-medium">Etapa</th>
                <th className="px-4 py-3 font-medium">Próximo prazo</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => router.push(`/gestao/clientes/${r.id}`)}
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      {r.urgent && <AlertTriangle className="size-3.5 text-destructive" />}
                      {r.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.passport}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.visa ?? '—'}</div>
                    <span className={cn('mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium', ELIG[r.eligibility].cls)}>
                      {ELIG[r.eligibility].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{r.stageLabel}</div>
                    <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${r.progress}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.nextDeadline ? <DeadlineCell due={r.nextDeadline} /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.assignedToName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS[r.status].cls)}>
                      {STATUS[r.status].label}
                    </span>
                  </td>
                  <td className="px-2">
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
