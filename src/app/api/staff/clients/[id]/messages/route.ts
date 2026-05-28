import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
import type { Message } from '@/types'

export async function POST(
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
  const { text } = await req.json().catch(() => ({}))
  const t = String(text ?? '').trim()
  if (!t) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })

  const msg: Message = {
    id: randomUUID(),
    clientId: id,
    sender: 'staff',
    authorName: session.name || 'Equipe',
    text: t,
    createdAt: new Date().toISOString(),
  }
  await db.messages.add(msg)
  return NextResponse.json({ ok: true }, { status: 201 })
}
