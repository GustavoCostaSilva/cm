import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Users, AlertTriangle, Clock, Gauge, ChevronRight } from 'lucide-react'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { slaState } from '@/lib/case-utils'
import { STAGE_KEYS, STAGE_LABELS, VISA_TYPES, type Client } from '@/types'
import { cn } from '@/lib/utils'

function activeStage(c: Client) {
  return c.stages.find((s) => s.status === 'active') ?? null
}
function daysSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

const KPI_TARGETS = [
  ['Tempo médio de entrega', '≤ 18 dias'],
  ['Processos sem erro na 1ª revisão', '≥ 85%'],
  ['Processos com 3ª rodada de revisão', '≤ 5%'],
  ['Retrabalho (correções pós-envio)', '≤ 3%'],
  ['SLAs cumpridos', '≥ 95%'],
  ['Tempo médio de resposta ao cliente', '≤ 24h'],
  ['Encaminhamento de cartas USCIS', '100% em 4h'],
  ['Taxa de RFEs', '≤ 10%'],
  ['Taxa de aprovação inicial', '≥ 90%'],
] as const

export default async function PainelPage() {
  const session = await getStaffSession()
  if (!session) redirect('/gestao')
  if (session.role !== 'coordenador') redirect('/gestao/clientes')

  const [clients, staff] = await Promise.all([db.clients.all(), db.staff.all()])
  const nameById = new Map(staff.map((m) => [m.id, m.name]))
  const now = new Date()

  const active = clients.filter((c) => c.status === 'active')
  const urgent = active.filter((c) => c.urgent)
  const overdue = active.filter((c) => {
    const s = activeStage(c)
    return s ? slaState(s, c.urgent, now) === 'overdue' : false
  })
  const slaCompliance = active.length
    ? Math.round(((active.length - overdue.length) / active.length) * 100)
    : 100
  const avgPipeline = active.length
    ? Math.round(active.reduce((acc, c) => acc + daysSince(c.createdAt), 0) / active.length)
    : 0

  const byStage = STAGE_KEYS.map((k) => ({
    key: k,
    label: STAGE_LABELS[k],
    count: active.filter((c) => activeStage(c)?.key === k).length,
  })).filter((s) => s.count > 0)

  const byVisa = VISA_TYPES.map((v) => ({ v, count: active.filter((c) => c.caseType === v).length }))

  const managers = staff.filter((m) => m.role === 'case_manager')
  const byManager = managers.map((m) => ({
    name: m.name,
    count: active.filter((c) => c.assignedTo === m.id).length,
  }))

  const stat = (label: string, value: string | number, Icon: typeof Users, tone: string) => (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn('size-4', tone)} />
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  )

  return (
    <StaffShell staffName={session.name} role={session.role}>
      <h1 className="text-xl font-bold tracking-tight text-foreground">Painel do Coordenador</h1>
      <p className="mb-5 text-sm text-muted-foreground">Visão geral dos casos do escritório.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat('Casos ativos', active.length, Users, 'text-primary')}
        {stat('Urgentes', urgent.length, AlertTriangle, 'text-destructive')}
        {stat('SLA estourado', overdue.length, Clock, 'text-[#8a6d0f]')}
        {stat('SLAs no prazo', `${slaCompliance}%`, Gauge, 'text-emerald-600')}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* SLA overdue + urgent lists */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Clock className="size-4 text-[#8a6d0f]" /> Precisam de atenção (SLA estourado)
            </h2>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum caso com SLA estourado. 👏</p>
            ) : (
              <ul className="divide-y divide-border">
                {overdue.map((c) => (
                  <CaseRow key={c.id} c={c} sub={`${STAGE_LABELS[activeStage(c)!.key]} · ${nameById.get(c.assignedTo ?? '') ?? '—'}`} />
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="size-4 text-destructive" /> Casos urgentes
            </h2>
            {urgent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum caso urgente no momento.</p>
            ) : (
              <ul className="divide-y divide-border">
                {urgent.map((c) => (
                  <CaseRow key={c.id} c={c} sub={`${c.caseType ?? ''} · ${activeStage(c) ? STAGE_LABELS[activeStage(c)!.key] : '—'}`} />
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Casos ativos por etapa</h2>
            <div className="space-y-2">
              {byStage.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-sm text-muted-foreground">{s.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary" style={{ width: `${Math.round((s.count / active.length) * 100)}%` }} />
                  </div>
                  <span className="w-6 text-right text-sm font-medium text-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Breakdowns + KPI targets */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Por tipo de visto</h2>
            <ul className="space-y-2 text-sm">
              {byVisa.map((b) => (
                <li key={b.v} className="flex justify-between">
                  <span className="text-muted-foreground">{b.v}</span>
                  <span className="font-medium text-foreground">{b.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Por case manager</h2>
            <ul className="space-y-2 text-sm">
              {byManager.map((b) => (
                <li key={b.name} className="flex justify-between">
                  <span className="text-muted-foreground">{b.name}</span>
                  <span className="font-medium text-foreground">{b.count}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Tempo médio no pipeline</span>
                <span className="font-medium text-foreground">{avgPipeline} dias</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Metas (manual §11)</h2>
            <p className="mb-3 text-xs text-muted-foreground">Referência operacional do escritório.</p>
            <ul className="space-y-1.5 text-sm">
              {KPI_TARGETS.map(([label, target]) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-foreground">
                    {target}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </StaffShell>
  )
}

function CaseRow({ c, sub }: { c: Client; sub: string }) {
  return (
    <li>
      <Link
        href={`/gestao/clientes/${c.id}`}
        className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-primary"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{c.fullName}</div>
          <div className="truncate text-xs text-muted-foreground">{sub}</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  )
}
