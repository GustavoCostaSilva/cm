import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient, isCoordinator } from '@/lib/perms'
import { VISA_TYPES, type Client, type ClientStatus, type Eligibility } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = await db.clients.get(id)
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  if (!canAccessClient(session, client)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const patch: Partial<Client> = {}

  if (body.status === 'active' || body.status === 'paused' || body.status === 'closed') {
    patch.status = body.status as ClientStatus
  }
  if (typeof body.email === 'string') patch.email = body.email.trim() || null
  if (typeof body.phone === 'string') patch.phone = body.phone.trim() || null
  if (typeof body.whatsapp === 'string') patch.whatsapp = body.whatsapp.replace(/\D/g, '') || null
  if (VISA_TYPES.includes(body.caseType)) patch.caseType = body.caseType
  if (typeof body.urgent === 'boolean') patch.urgent = body.urgent
  if (body.eligibility === 'pending' || body.eligibility === 'eligible' || body.eligibility === 'ineligible') {
    patch.eligibility = body.eligibility as Eligibility
  }
  // Reassigning the owner is coordenador-only.
  if (isCoordinator(session.role) && typeof body.assignedTo === 'string') {
    patch.assignedTo = body.assignedTo.trim() || null
  }

  await db.clients.update(id, patch)
  return NextResponse.json({ ok: true })
}
