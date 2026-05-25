import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardList, MessageSquarePlus, History, CalendarClock, IdCard } from 'lucide-react'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { StageManager } from '@/components/staff/StageManager'
import { UpdateComposer } from '@/components/staff/UpdateComposer'
import { DeadlineManager } from '@/components/staff/DeadlineManager'
import { ClientStatusControl } from '@/components/staff/ClientStatusControl'
import { StaffHistory } from '@/components/staff/StaffHistory'
import { progressPercent, isCaseComplete, currentStage, formatDate } from '@/lib/case-utils'
import { STAGE_LABELS } from '@/types'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getStaffSession()
  const client = db.clients.get(id)
  if (!client) notFound()

  const events = db.events.byClient(id)
  const deadlines = db.deadlines.byClient(id)
  const pct = progressPercent(client)
  const complete = isCaseComplete(client)
  const nowIso = new Date().toISOString()

  return (
    <StaffShell staffName={session?.name ?? 'Equipe'}>
      <Link
        href="/gestao/clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para clientes
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {client.fullName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <IdCard className="size-3.5" />
                {client.passport}
              </span>
              <span>Nasc.: {formatDate(client.dateOfBirth)}</span>
              {client.caseType && <span>· {client.caseType}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {complete ? 'Caso concluído' : `Etapa atual: ${STAGE_LABELS[currentStage(client).key]}`}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-medium text-foreground">{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Etapas do caso</h2>
            </div>
            <StageManager clientId={client.id} stages={client.stages} nowIso={nowIso} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquarePlus className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Registrar atualização</h2>
            </div>
            <UpdateComposer clientId={client.id} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Histórico do caso</h2>
            </div>
            <StaffHistory events={events} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Informações</h2>
              <ClientStatusControl clientId={client.id} status={client.status} />
            </div>
            <dl className="space-y-2 text-sm">
              <Info label="E-mail" value={client.email} />
              <Info label="Telefone" value={client.phone} />
              <Info label="WhatsApp" value={client.whatsapp} />
              <Info label="Responsável" value={client.assignedTo} />
              <Info label="Cliente desde" value={formatDate(client.createdAt)} />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Prazos</h2>
            </div>
            <DeadlineManager clientId={client.id} deadlines={deadlines} />
          </section>
        </aside>
      </div>
    </StaffShell>
  )
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || '—'}</dd>
    </div>
  )
}
