import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Users, AlertTriangle, Clock, Gauge, ChevronRight } from 'lucide-react'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { slaState } from '@/lib/case-utils'
import { STAGE_KEYS, STAGE_LABELS, STAGE_SLA_HOURS, VISA_TYPES, type Client, type CaseReview } from '@/types'
import { cn } from '@/lib/utils'

function activeStage(c: Client) {
  return c.stages.find((s) => s.status === 'active') ?? null
}
function daysSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000))
}

export default async function PainelPage() {
  const session = await getStaffSession()
  if (!session) redirect('/gestao')
  if (session.role !== 'coordenador') redirect('/gestao/clientes')

  const [clients, staff, reviews] = await Promise.all([
    db.clients.all(),
    db.staff.all(),
    db.reviews.all(),
  ])
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

  // ── KPIs do manual §11 (valores reais quando há dados) ──
  const stageOf = (c: Client, k: string) => c.stages.find((s) => s.key === k)

  const deliveryDays = clients
    .map((c) => {
      const env = stageOf(c, 'envio')?.completedAt
      const start = stageOf(c, 'onboarding')?.startedAt ?? c.createdAt
      return env ? (new Date(env).getTime() - new Date(start).getTime()) / 86_400_000 : null
    })
    .filter((d): d is number => d != null)
  const avgDelivery = deliveryDays.length
    ? Math.round(deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length)
    : null

  const reviewsByClient = new Map<string, CaseReview[]>()
  for (const r of reviews) {
    const arr = reviewsByClient.get(r.clientId) ?? []
    arr.push(r)
    reviewsByClient.set(r.clientId, arr)
  }
  const reviewedGroups = [...reviewsByClient.values()]
  const firstPassClean = reviewedGroups.filter(
    (rs) => [...rs].sort((a, b) => a.round - b.round)[0]?.outcome === 'approved',
  ).length
  const pctFirstPass = reviewedGroups.length
    ? Math.round((firstPassClean / reviewedGroups.length) * 100)
    : null
  const pctThird = reviewedGroups.length
    ? Math.round((reviewedGroups.filter((rs) => rs.length >= 3).length / reviewedGroups.length) * 100)
    : null

  let slaTotal = 0
  let slaMet = 0
  for (const c of clients) {
    for (const s of c.stages) {
      if (s.status === 'done' && s.startedAt && s.completedAt) {
        const hrs = STAGE_SLA_HOURS[s.key]?.[c.urgent ? 'urgent' : 'normal'] ?? 0
        if (hrs > 0) {
          slaTotal++
          const elapsed = (new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 3_600_000
          if (elapsed <= hrs) slaMet++
        }
      }
    }
  }
  const pctSlaMet = slaTotal ? Math.round((slaMet / slaTotal) * 100) : null

  const weekAgo = Date.now() - 7 * 86_400_000
  const finishedWeek = clients.filter((c) => {
    const env = stageOf(c, 'envio')?.completedAt
    return env ? new Date(env).getTime() >= weekAgo : false
  }).length

  type KpiState = 'ok' | 'bad' | 'na'
  const kpis: { label: string; value: string; target: string; state: KpiState }[] = [
    {
      label: 'Tempo médio de entrega',
      value: avgDelivery == null ? '—' : `${avgDelivery} dias`,
      target: '≤ 18 dias',
      state: avgDelivery == null ? 'na' : avgDelivery <= 18 ? 'ok' : 'bad',
    },
    {
      label: 'Sem erro na 1ª revisão',
      value: pctFirstPass == null ? '—' : `${pctFirstPass}%`,
      target: '≥ 85%',
      state: pctFirstPass == null ? 'na' : pctFirstPass >= 85 ? 'ok' : 'bad',
    },
    {
      label: 'Com 3ª rodada de revisão',
      value: pctThird == null ? '—' : `${pctThird}%`,
      target: '≤ 5%',
      state: pctThird == null ? 'na' : pctThird <= 5 ? 'ok' : 'bad',
    },
    {
      label: 'SLAs cumpridos',
      value: pctSlaMet == null ? '—' : `${pctSlaMet}%`,
      target: '≥ 95%',
      state: pctSlaMet == null ? 'na' : pctSlaMet >= 95 ? 'ok' : 'bad',
    },
    { label: 'Finalizados (7 dias)', value: String(finishedWeek), target: 'meta da direção', state: 'na' },
    { label: 'Retrabalho pós-envio', value: '—', target: '≤ 3%', state: 'na' },
    { label: 'Resposta ao cliente', value: '—', target: '≤ 24h', state: 'na' },
    { label: 'Cartas USCIS encaminhadas', value: '—', target: '100% em 4h', state: 'na' },
    { label: 'Taxa de RFEs', value: '—', target: '≤ 10%', state: 'na' },
    { label: 'Aprovação inicial', value: '—', target: '≥ 90%', state: 'na' },
  ]

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
            <h2 className="mb-1 text-sm font-semibold text-foreground">Indicadores (manual §11)</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Valores reais quando há dados; “—” aguarda histórico.
            </p>
            <ul className="space-y-2 text-sm">
              {kpis.map((k) => (
                <li key={k.label} className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                    <span
                      className={cn(
                        'size-2 shrink-0 rounded-full',
                        k.state === 'ok'
                          ? 'bg-emerald-500'
                          : k.state === 'bad'
                            ? 'bg-destructive'
                            : 'bg-muted-foreground/30',
                      )}
                    />
                    <span className="truncate">{k.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        k.state === 'ok'
                          ? 'text-emerald-700'
                          : k.state === 'bad'
                            ? 'text-destructive'
                            : 'text-foreground',
                      )}
                    >
                      {k.value}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {k.target}
                    </span>
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
