import { redirect } from 'next/navigation'
import { CalendarClock, Route, History, FolderOpen } from 'lucide-react'
import { db } from '@/lib/db'
import { getClientSession } from '@/lib/server-session'
import { ContactFooter } from '@/components/client/ContactFooter'
import { ClientMilestones } from '@/components/client/ClientMilestones'
import { CaseTimeline } from '@/components/client/CaseTimeline'
import { ClientDocuments } from '@/components/client/ClientDocuments'
import { LogoutButton } from '@/components/LogoutButton'
import { clientMilestones, formatDate, daysUntil } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

const STATUS_MAP = {
  active: { label: 'Em andamento', cls: 'bg-primary/10 text-primary' },
  paused: { label: 'Pausado', cls: 'bg-[#c9a227]/15 text-[#8a6d0f]' },
  closed: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-700' },
} as const

function deadlineLabel(due: string): { text: string; tone: string } {
  const d = daysUntil(due)
  if (d < 0) return { text: `Vencido há ${Math.abs(d)} dia(s)`, tone: 'text-destructive' }
  if (d === 0) return { text: 'É hoje', tone: 'text-[#8a6d0f]' }
  if (d === 1) return { text: 'Amanhã', tone: 'text-foreground' }
  return { text: `Em ${d} dias`, tone: 'text-foreground' }
}

export default async function MeuCasoPage() {
  const session = await getClientSession()
  if (!session) redirect('/')
  const client = await db.clients.get(session.sub)
  if (!client) redirect('/')

  const office = await db.office.get()
  const events = (await db.events.byClient(client.id)).filter((e) => e.visibleToClient)
  const documents = (await db.documents.byClient(client.id)).filter((d) => d.visibleToClient)
  const nextDeadline =
    (await db.deadlines.byClient(client.id)).filter((d) => d.status === 'pending')[0] ?? null
  const manager = client.assignedTo ? await db.staff.get(client.assignedTo) : null

  const milestones = clientMilestones(client)
  const doneCount = milestones.filter((m) => m.status === 'done').length
  const hasActive = milestones.some((m) => m.status === 'active')
  const pct = Math.round(((doneCount + (hasActive ? 0.5 : 0)) / milestones.length) * 100)
  const complete = doneCount === milestones.length
  const current = milestones.find((m) => m.status === 'active') ?? null

  const firstName = client.fullName.split(' ')[0]
  const status = STATUS_MAP[client.status]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#b22234] to-[#1b3a6b] text-xs font-bold text-white">
              GV
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">{office.officeName}</p>
              <p className="text-xs text-muted-foreground">Portal do Cliente</p>
            </div>
          </div>
          <LogoutButton endpoint="/api/auth/client-logout" redirectTo="/" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-7">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Olá,</p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{firstName}</h1>
              {client.caseType && (
                <p className="mt-1 text-sm text-muted-foreground">Processo {client.caseType}</p>
              )}
            </div>
            <span className={cn('rounded-full px-3 py-1 text-xs font-medium', status.cls)}>
              {status.label}
            </span>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {complete ? 'Caso concluído' : current ? `Etapa atual: ${current.label}` : 'Iniciando'}
              </span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <Route className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Acompanhamento do seu caso</h2>
            </div>
            <ClientMilestones milestones={milestones} />
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Próximo prazo</h2>
              </div>
              {nextDeadline ? (
                <div>
                  <p className="text-sm font-medium text-foreground">{nextDeadline.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDate(nextDeadline.dueDate)}</p>
                  <p className={cn('mt-2 text-sm font-semibold', deadlineLabel(nextDeadline.dueDate).tone)}>
                    {deadlineLabel(nextDeadline.dueDate).text}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum prazo pendente no momento.</p>
              )}
            </section>

            {manager && (
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-1 text-sm font-semibold text-foreground">Equipe responsável</h2>
                <p className="text-sm text-muted-foreground">{manager.name}</p>
              </section>
            )}
          </aside>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Atualizações</h2>
          </div>
          <CaseTimeline events={events} />
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FolderOpen className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Seus documentos</h2>
          </div>
          <ClientDocuments documents={documents} />
        </section>
      </main>

      <ContactFooter office={office} />
    </div>
  )
}
