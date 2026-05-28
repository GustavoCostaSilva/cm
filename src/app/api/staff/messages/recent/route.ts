import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { visibleClients } from '@/lib/perms'

// Recent client-sent messages, scoped to the clients this staff member can see.
// Polled by the StaffNotifier to surface a browser/in-app alert when a client
// writes. Returns the staff id so the client can key its "already seen" cursor.
export async function GET() {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const [recent, clients] = await Promise.all([
    db.messages.recentFromClients(30),
    db.clients.all(),
  ])
  const allowed = new Map(visibleClients(clients, session).map((c) => [c.id, c.fullName]))

  const messages = recent
    .filter((m) => allowed.has(m.clientId))
    .map((m) => ({
      id: m.id,
      clientId: m.clientId,
      clientName: allowed.get(m.clientId) ?? 'Cliente',
      authorName: m.authorName,
      text: m.text,
      createdAt: m.createdAt,
    }))

  return NextResponse.json({ staffId: session.sub, now: new Date().toISOString(), messages })
}
