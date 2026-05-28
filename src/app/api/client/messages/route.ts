import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getClientSession } from '@/lib/server-session'
import type { Message } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getClientSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const { text } = await req.json().catch(() => ({}))
  const t = String(text ?? '').trim()
  if (!t) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })

  const msg: Message = {
    id: randomUUID(),
    clientId: session.sub,
    sender: 'client',
    authorName: session.name || 'Cliente',
    text: t,
    createdAt: new Date().toISOString(),
  }
  await db.messages.add(msg)
  return NextResponse.json({ ok: true }, { status: 201 })
}
