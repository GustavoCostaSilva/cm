import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { AgendaCalendar, type AgendaItem } from '@/components/staff/AgendaCalendar'

export default async function AgendaPage() {
  const session = await getStaffSession()
  const [clients, deadlines] = await Promise.all([db.clients.all(), db.deadlines.all()])

  const visibleClients =
    session?.role === 'case_manager'
      ? clients.filter((c) => c.assignedTo === session.sub)
      : clients
  const allowed = new Set(visibleClients.map((c) => c.id))
  const nameById = new Map(clients.map((c) => [c.id, c.fullName]))

  const items: AgendaItem[] = deadlines
    .filter((d) => allowed.has(d.clientId))
    .map((d) => ({
      id: d.id,
      clientId: d.clientId,
      clientName: nameById.get(d.clientId) ?? 'Cliente',
      title: d.title,
      dueDate: d.dueDate,
      status: d.status,
    }))

  return (
    <StaffShell staffName={session?.name ?? 'Equipe'} role={session?.role}>
      <h1 className="text-xl font-bold tracking-tight text-foreground">Agenda de prazos</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Todos os prazos dos clientes em um só lugar. Clique em um prazo para abrir o cliente.
      </p>
      <AgendaCalendar items={items} />
    </StaffShell>
  )
}
