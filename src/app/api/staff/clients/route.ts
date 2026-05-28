import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { normalizeDob } from '@/lib/auth'
import { freshStages, VISA_TYPES, type Client, type VisaType } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const fullName = String(body.fullName ?? '').trim()
  const passport = String(body.passport ?? '').trim()
  const dateOfBirth = normalizeDob(String(body.dateOfBirth ?? ''))

  if (!fullName || !passport || !dateOfBirth) {
    return NextResponse.json(
      { error: 'Nome, passaporte e data de nascimento são obrigatórios.' },
      { status: 400 },
    )
  }
  if (await db.clients.getByPassport(passport)) {
    return NextResponse.json(
      { error: 'Já existe um cliente com este passaporte.' },
      { status: 409 },
    )
  }

  const visa: VisaType | null = VISA_TYPES.includes(body.caseType) ? body.caseType : null
  // Owner (case manager). A case manager creating a client owns it by default.
  const assignedTo = body.assignedTo
    ? String(body.assignedTo)
    : session.role === 'case_manager'
      ? session.sub
      : null

  const now = new Date().toISOString()
  const stages = freshStages()
  stages[0].status = 'active'
  stages[0].startedAt = now

  const client: Client = {
    id: `cli_${Date.now().toString(36)}`,
    fullName,
    passport,
    dateOfBirth,
    email: body.email ? String(body.email).trim() : null,
    phone: body.phone ? String(body.phone).trim() : null,
    whatsapp: body.whatsapp ? String(body.whatsapp).replace(/\D/g, '') : null,
    caseType: visa,
    urgent: Boolean(body.urgent),
    eligibility: 'pending',
    assignedTo,
    status: 'active',
    createdAt: now,
    stages,
  }
  await db.clients.create(client)
  await db.events.add({
    id: randomUUID(),
    clientId: client.id,
    stageKey: null,
    type: 'created',
    text: 'Caso aberto e cadastrado no portal de acompanhamento.',
    author: session.name || 'Equipe',
    createdAt: now,
    visibleToClient: true,
    notified: false,
  })

  return NextResponse.json({ ok: true, id: client.id }, { status: 201 })
}
