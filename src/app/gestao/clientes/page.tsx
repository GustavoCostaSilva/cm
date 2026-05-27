import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { ClientsTable, type ClientRow } from '@/components/staff/ClientsTable'
import { currentStage, progressPercent, isCaseComplete } from '@/lib/case-utils'
import { STAGE_LABELS } from '@/types'

export default async function ClientesPage() {
  const session = await getStaffSession()
  const [allClients, deadlines, staff] = await Promise.all([
    db.clients.all(),
    db.deadlines.all(),
    db.staff.all(),
  ])
  const nameById = new Map(staff.map((m) => [m.id, m.name]))

  // Case managers only see their own clients; admin sees everyone.
  const clients =
    session?.role === 'case_manager'
      ? allClients.filter((c) => c.assignedTo === session.sub)
      : allClients

  const rows: ClientRow[] = clients.map((c) => {
    const next =
      deadlines
        .filter((d) => d.clientId === c.id && d.status === 'pending')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
    return {
      id: c.id,
      fullName: c.fullName,
      passport: c.passport,
      caseType: c.caseType,
      status: c.status,
      assignedTo: c.assignedTo ? (nameById.get(c.assignedTo) ?? '—') : null,
      stageLabel: isCaseComplete(c) ? 'Concluído' : STAGE_LABELS[currentStage(c).key],
      progress: progressPercent(c),
      nextDeadline: next ? next.dueDate : null,
    }
  })

  return (
    <StaffShell staffName={session?.name ?? 'Equipe'} role={session?.role}>
      <ClientsTable rows={rows} />
    </StaffShell>
  )
}
