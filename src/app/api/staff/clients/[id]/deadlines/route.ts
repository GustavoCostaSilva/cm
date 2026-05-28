import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
import type { Deadline, StageKey } from '@/types'
import type { StaffSession } from '@/lib/session'

// Resolve the client and authorize: case managers may only touch their own.
async function authorizeClient(
  session: StaffSession,
  clientId: string,
): Promise<NextResponse | null> {
  const client = await db.clients.get(clientId)
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  if (!canAccessClient(session, client)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  return null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const deny = await authorizeClient(session, id)
  if (deny) return deny

  const body = await req.json().catch(() => ({}))
  const title = String(body.title ?? '').trim()
  const dueDate = String(body.dueDate ?? '').trim()
  if (!title || !dueDate) {
    return NextResponse.json({ error: 'Informe título e data.' }, { status: 400 })
  }

  const deadline: Deadline = {
    id: randomUUID(),
    clientId: id,
    title,
    dueDate,
    status: 'pending',
    stageKey: (body.stageKey as StageKey | null) ?? null,
  }
  await db.deadlines.add(deadline)
  return NextResponse.json({ ok: true, deadline }, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const deny = await authorizeClient(session, id)
  if (deny) return deny

  const body = await req.json().catch(() => ({}))
  const deadlineId = String(body.deadlineId ?? '')
  if (!deadlineId) return NextResponse.json({ error: 'deadlineId obrigatório' }, { status: 400 })
  // The deadline must belong to this client.
  const owned = (await db.deadlines.byClient(id)).some((d) => d.id === deadlineId)
  if (!owned) return NextResponse.json({ error: 'Prazo não encontrado' }, { status: 404 })

  const patch: Partial<Deadline> = {}
  if (body.status === 'done' || body.status === 'pending') patch.status = body.status
  if (typeof body.title === 'string') patch.title = body.title.trim()
  if (typeof body.dueDate === 'string') patch.dueDate = body.dueDate.trim()

  await db.deadlines.update(deadlineId, patch)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  const deny = await authorizeClient(session, id)
  if (deny) return deny

  const deadlineId = new URL(req.url).searchParams.get('deadline_id')
  if (!deadlineId) return NextResponse.json({ error: 'deadline_id obrigatório' }, { status: 400 })
  const owned = (await db.deadlines.byClient(id)).some((d) => d.id === deadlineId)
  if (!owned) return NextResponse.json({ error: 'Prazo não encontrado' }, { status: 404 })

  await db.deadlines.remove(deadlineId)
  return NextResponse.json({ ok: true })
}
