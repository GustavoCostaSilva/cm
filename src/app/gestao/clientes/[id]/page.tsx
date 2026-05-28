import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardList, MessageSquarePlus, History, CalendarClock, IdCard, AlertTriangle, ListChecks, FolderOpen, MessagesSquare } from 'lucide-react'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
import { StaffShell } from '@/components/staff/StaffShell'
import { StageManager } from '@/components/staff/StageManager'
import { ChecklistManager } from '@/components/staff/ChecklistManager'
import { DocumentsManager } from '@/components/staff/DocumentsManager'
import { UpdateComposer } from '@/components/staff/UpdateComposer'
import { DeadlineManager } from '@/components/staff/DeadlineManager'
import { CaseControls } from '@/components/staff/CaseControls'
import { AssignControls } from '@/components/staff/AssignControls'
import { StaffHistory } from '@/components/staff/StaffHistory'
import { MessageThread } from '@/components/MessageThread'
import { MessageComposer } from '@/components/MessageComposer'
import { LiveRefresh } from '@/components/LiveRefresh'
import { progressPercent, isCaseComplete, currentStage, formatDate } from '@/lib/case-utils'
import { STAGE_LABELS, ELIGIBILITY_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const ELIG_CLS = {
  pending: 'bg-secondary text-muted-foreground',
  eligible: 'bg-emerald-100 text-emerald-700',
  ineligible: 'bg-destructive/10 text-destructive',
} as const

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getStaffSession()
  const client = await db.clients.get(id)
  if (!client) notFound()
  if (session && !canAccessClient(session, client)) notFound()

  const [events, deadlines, documents, messages, staffAll] = await Promise.all([
    db.events.byClient(id),
    db.deadlines.byClient(id),
    db.documents.byClient(id),
    db.messages.byClient(id),
    db.staff.all(),
  ])
  const manager = client.assignedTo ? (staffAll.find((m) => m.id === client.assignedTo) ?? null) : null
  const attorney = client.attorneyId ? (staffAll.find((m) => m.id === client.attorneyId) ?? null) : null
  const attorneys = staffAll.filter((m) => m.role === 'advogado').map((m) => ({ id: m.id, name: m.name }))
  const managers = staffAll.filter((m) => m.role === 'case_manager').map((m) => ({ id: m.id, name: m.name }))
  const pct = progressPercent(client)
  const complete = isCaseComplete(client)
  const nowIso = new Date().toISOString()

  return (
    <StaffShell staffName={session?.name ?? 'Equipe'} role={session?.role}>
      <LiveRefresh intervalMs={12000} />
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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{client.fullName}</h1>
              {client.urgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  <AlertTriangle className="size-3" />
                  URGENTE
                </span>
              )}
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', ELIG_CLS[client.eligibility])}>
                {ELIGIBILITY_LABELS[client.eligibility]}
              </span>
            </div>
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
            <StageManager clientId={client.id} stages={client.stages} urgent={client.urgent} nowIso={nowIso} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Checklist do visto</h2>
            </div>
            <ChecklistManager clientId={client.id} visa={client.caseType} done={client.checklistDone} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FolderOpen className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Documentos</h2>
            </div>
            <DocumentsManager clientId={client.id} documents={documents} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessagesSquare className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Mensagens com o cliente</h2>
            </div>
            <MessageThread messages={messages} viewer="staff" />
            <MessageComposer endpoint={`/api/staff/clients/${client.id}/messages`} />
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
            <h2 className="mb-3 text-sm font-semibold text-foreground">Responsáveis</h2>
            <AssignControls
              clientId={client.id}
              attorneyId={client.attorneyId}
              assignedTo={client.assignedTo}
              attorneys={attorneys}
              managers={managers}
              canAssignManager={session?.role === 'coordenador'}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Gestão do caso</h2>
            <CaseControls
              clientId={client.id}
              status={client.status}
              eligibility={client.eligibility}
              urgent={client.urgent}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Informações</h2>
            <dl className="space-y-2 text-sm">
              <Info label="E-mail" value={client.email} />
              <Info label="Telefone" value={client.phone} />
              <Info label="WhatsApp" value={client.whatsapp} />
              <Info label="Advogado" value={attorney?.name ?? null} />
              <Info label="Case Manager" value={manager?.name ?? null} />
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
