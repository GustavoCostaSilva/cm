import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { visibleClients, canSeeAllClients } from '@/lib/perms'
import { StaffShell } from '@/components/staff/StaffShell'
import { ClientsTable, type ClientRow } from '@/components/staff/ClientsTable'
import { currentStage, progressPercent, isCaseComplete } from '@/lib/case-utils'
import { STAGE_LABELS } from '@/types'

export default async function ClientesPage() {
  const session = await getStaffSession()
  if (!session) redirect('/gestao')

  const [allClients, deadlines, staff] = await Promise.all([
    db.clients.all(),
    db.deadlines.all(),
    db.staff.all(),
  ])
  const nameById = new Map(staff.map((m) => [m.id, m.name]))
  const clients = visibleClients(allClients, session)
  const managers = staff
    .filter((m) => m.role === 'case_manager')
    .map((m) => ({ id: m.id, name: m.name }))
  const attorneys = staff
    .filter((m) => m.role === 'advogado')
    .map((m) => ({ id: m.id, name: m.name }))

  const rows: ClientRow[] = clients.map((c) => {
    const next =
      deadlines
        .filter((d) => d.clientId === c.id && d.status === 'pending')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
    return {
      id: c.id,
      fullName: c.fullName,
      passport: c.passport,
      visa: c.caseType,
      urgent: c.urgent,
      eligibility: c.eligibility,
      status: c.status,
      assignedToId: c.assignedTo,
      assignedToName: c.assignedTo ? (nameById.get(c.assignedTo) ?? '—') : null,
      stageLabel: isCaseComplete(c) ? 'Concluído' : STAGE_LABELS[currentStage(c).key],
      progress: progressPercent(c),
      nextDeadline: next ? next.dueDate : null,
    }
  })

  return (
    <StaffShell staffName={session.name} role={session.role}>
      <ClientsTable
        rows={rows}
        managers={managers}
        attorneys={attorneys}
        canFilterManager={canSeeAllClients(session.role)}
      />
    </StaffShell>
  )
}
