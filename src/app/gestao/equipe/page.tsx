import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { TeamManager } from '@/components/staff/TeamManager'

export default async function EquipePage() {
  const session = await getStaffSession()
  if (!session || session.role !== 'coordenador') redirect('/gestao/clientes')

  const [staff, clients] = await Promise.all([db.staff.all(), db.clients.all()])
  const clientCounts: Record<string, number> = {}
  for (const c of clients) {
    if (c.assignedTo) clientCounts[c.assignedTo] = (clientCounts[c.assignedTo] ?? 0) + 1
  }

  return (
    <StaffShell staffName={session.name} role={session.role}>
      <TeamManager staff={staff} clientCounts={clientCounts} selfId={session.sub} />
    </StaffShell>
  )
}
