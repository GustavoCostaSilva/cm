import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
import { sendClientNotification } from '@/lib/email'
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

  // Reach the client by e-mail too — they aren't expected to watch the chat
  // live. Best-effort: a mail failure must not fail the message send.
  let mail: { delivered: boolean; dev: boolean } | null = null
  if (client.email) {
    try {
      const office = await db.office.get()
      mail = await sendClientNotification({
        to: client.email,
        clientName: client.fullName,
        headline: 'Você recebeu uma nova mensagem',
        message: t,
        portalUrl: `${new URL(req.url).origin}/meu-caso`,
        office,
        ctaLabel: 'Abrir conversa',
      })
    } catch {
      mail = null
    }
  }

  return NextResponse.json({ ok: true, mail }, { status: 201 })
}
