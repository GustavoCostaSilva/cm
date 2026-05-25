import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import type { Client, ClientStatus } from '@/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = db.clients.get(id)
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const patch: Partial<Client> = {}

  if (typeof body.status === 'string') patch.status = body.status as ClientStatus
  if (typeof body.email === 'string') patch.email = body.email.trim() || null
  if (typeof body.phone === 'string') patch.phone = body.phone.trim() || null
  if (typeof body.whatsapp === 'string') patch.whatsapp = body.whatsapp.replace(/\D/g, '') || null
  if (typeof body.caseType === 'string') patch.caseType = body.caseType.trim() || null
  if (typeof body.assignedTo === 'string') patch.assignedTo = body.assignedTo.trim() || null

  db.clients.update(id, patch)
  return NextResponse.json({ ok: true })
}
