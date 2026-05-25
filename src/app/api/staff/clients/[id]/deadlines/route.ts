import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import type { Deadline, StageKey } from '@/types'

async function ensureStaff() {
  const session = await getStaffSession()
  return session
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await ensureStaff())) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { id } = await params
  if (!db.clients.get(id)) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

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
  db.deadlines.add(deadline)
  return NextResponse.json({ ok: true, deadline }, { status: 201 })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await ensureStaff())) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  await params
  const body = await req.json().catch(() => ({}))
  const deadlineId = String(body.deadlineId ?? '')
  if (!deadlineId) return NextResponse.json({ error: 'deadlineId obrigatório' }, { status: 400 })

  const patch: Partial<Deadline> = {}
  if (body.status === 'done' || body.status === 'pending') patch.status = body.status
  if (typeof body.title === 'string') patch.title = body.title.trim()
  if (typeof body.dueDate === 'string') patch.dueDate = body.dueDate.trim()

  db.deadlines.update(deadlineId, patch)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await ensureStaff())) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  await params
  const deadlineId = new URL(req.url).searchParams.get('deadline_id')
  if (!deadlineId) return NextResponse.json({ error: 'deadline_id obrigatório' }, { status: 400 })
  db.deadlines.remove(deadlineId)
  return NextResponse.json({ ok: true })
}
