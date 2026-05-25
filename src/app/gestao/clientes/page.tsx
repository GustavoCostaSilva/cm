import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { ClientsTable, type ClientRow } from '@/components/staff/ClientsTable'
import { currentStage, progressPercent, isCaseComplete } from '@/lib/case-utils'
import { STAGE_LABELS } from '@/types'

export default async function ClientesPage() {
  const session = await getStaffSession()
  const clients = db.clients.all()
  const deadlines = db.deadlines.all()

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
      assignedTo: c.assignedTo,
      stageLabel: isCaseComplete(c) ? 'Concluído' : STAGE_LABELS[currentStage(c).key],
      progress: progressPercent(c),
      nextDeadline: next ? next.dueDate : null,
    }
  })

  return (
    <StaffShell staffName={session?.name ?? 'Equipe'}>
      <ClientsTable rows={rows} />
    </StaffShell>
  )
}
