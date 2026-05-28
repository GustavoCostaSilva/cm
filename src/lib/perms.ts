import type { Client, StaffRole } from '@/types'
import type { StaffSession } from '@/lib/session'

// Coordenador = top role: sees everything + manages team/office config.
export function isCoordinator(role: StaffRole): boolean {
  return role === 'coordenador'
}

// Case managers see only the clients assigned to them. Coordenador and the
// cross-case support roles (coletor, revisor, assistente jurídico) see all.
export function canSeeAllClients(role: StaffRole): boolean {
  return role !== 'case_manager'
}

export function visibleClients(clients: Client[], session: StaffSession): Client[] {
  return canSeeAllClients(session.role)
    ? clients
    : clients.filter((c) => c.assignedTo === session.sub)
}

// Whether a staff member may view/act on a given client.
export function canAccessClient(session: StaffSession, client: Client): boolean {
  return canSeeAllClients(session.role) || client.assignedTo === session.sub
}
