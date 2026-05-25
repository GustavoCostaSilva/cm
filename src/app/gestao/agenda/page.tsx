import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { StaffShell } from '@/components/staff/StaffShell'
import { AgendaCalendar, type AgendaItem } from '@/components/staff/AgendaCalendar'

export default async function AgendaPage() {
  const session = await getStaffSession()
  const nameById = new Map(db.clients.all().map((c) => [c.id, c.fullName]))
  const items: AgendaItem[] = db.deadlines.all().map((d) => ({
    id: d.id,
    clientId: d.clientId,
    clientName: nameById.get(d.clientId) ?? 'Cliente',
    title: d.title,
    dueDate: d.dueDate,
    status: d.status,
  }))

  return (
    <StaffShell staffName={session?.name ?? 'Equipe'}>
      <h1 className="text-xl font-bold tracking-tight text-foreground">Agenda de prazos</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Todos os prazos dos clientes em um só lugar. Clique em um prazo para abrir o cliente.
      </p>
      <AgendaCalendar items={items} />
    </StaffShell>
  )
}
