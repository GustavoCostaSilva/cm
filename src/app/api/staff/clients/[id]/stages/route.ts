import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { sendStageNotification, type StageMailKind } from '@/lib/email'
import { currentStage } from '@/lib/case-utils'
import { STAGE_KEYS, STAGE_LABELS, type StageKey, type CaseEvent, type StageProgress } from '@/types'

function nextStageKey(key: StageKey): StageKey | null {
  const i = STAGE_KEYS.indexOf(key)
  return i >= 0 && i < STAGE_KEYS.length - 1 ? STAGE_KEYS[i + 1] : null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = db.clients.get(id)
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action ?? '')
  const stageKey = body.stageKey as StageKey | undefined
  const message = String(body.message ?? '').trim()
  const notify = Boolean(body.notify)
  const author = session.name || 'Equipe'
  const now = new Date().toISOString()

  const stages: StageProgress[] = client.stages.map((s) => ({ ...s }))
  const newEvents: CaseEvent[] = []
  const addEvent = (e: Omit<CaseEvent, 'id' | 'clientId'>) =>
    newEvents.push({ id: randomUUID(), clientId: client.id, ...e })

  let mailKind: StageMailKind | null = null
  let mailStageKey: StageKey | null = stageKey ?? null
  let mailMessage = message

  const findStage = (k: StageKey) => stages.find((s) => s.key === k)

  if (action === 'start') {
    if (!stageKey || !findStage(stageKey)) {
      return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 })
    }
    const s = findStage(stageKey)!
    s.status = 'active'
    if (!s.startedAt) s.startedAt = now
    s.completedAt = null
    addEvent({
      stageKey,
      type: 'stage_started',
      text: message || `Etapa "${STAGE_LABELS[stageKey]}" iniciada.`,
      author,
      createdAt: now,
      visibleToClient: true,
      notified: notify,
    })
    if (notify) {
      mailKind = 'update'
      mailMessage = message || `Iniciamos a etapa "${STAGE_LABELS[stageKey]}" do seu caso.`
    }
  } else if (action === 'complete') {
    if (!stageKey || !findStage(stageKey)) {
      return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 })
    }
    const s = findStage(stageKey)!
    s.status = 'done'
    if (!s.startedAt) s.startedAt = now
    s.completedAt = now
    if (message) s.note = message
    addEvent({
      stageKey,
      type: 'stage_completed',
      text: message || `Etapa "${STAGE_LABELS[stageKey]}" concluída.`,
      author,
      createdAt: now,
      visibleToClient: true,
      notified: notify,
    })
    const nk = nextStageKey(stageKey)
    if (nk) {
      const ns = findStage(nk)!
      if (ns.status === 'pending') {
        ns.status = 'active'
        ns.startedAt = now
      }
    }
    if (notify) {
      mailKind = 'completed'
      mailMessage = message || `Concluímos a etapa "${STAGE_LABELS[stageKey]}" do seu caso.`
    }
  } else if (action === 'flag' || action === 'note') {
    if (!message) {
      return NextResponse.json({ error: 'Escreva uma mensagem.' }, { status: 400 })
    }
    const isFlag = action === 'flag'
    const visible = isFlag ? true : body.visibleToClient !== false
    addEvent({
      stageKey: stageKey ?? null,
      type: isFlag ? 'flag' : 'note',
      text: message,
      author,
      createdAt: now,
      visibleToClient: visible,
      notified: notify && visible,
    })
    if (notify && visible) {
      mailKind = isFlag ? 'flag' : 'update'
      mailMessage = message
    }
  } else {
    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  }

  // Persist stage changes (only when they actually changed) and events.
  if (action === 'start' || action === 'complete') {
    db.clients.update(client.id, { stages })
  }
  for (const e of newEvents) db.events.add(e)

  // Send email notification if requested and the client has an address.
  let mail: { delivered: boolean; dev: boolean } | null = null
  if (mailKind && client.email) {
    const origin = new URL(req.url).origin
    const office = db.office.get()
    const key = mailStageKey ?? currentStage(client).key
    mail = await sendStageNotification({
      to: client.email,
      clientName: client.fullName,
      stageKey: key,
      kind: mailKind,
      message: mailMessage,
      portalUrl: `${origin}/meu-caso`,
      office,
    })
  }

  return NextResponse.json({ ok: true, mail, notified: Boolean(mailKind) })
}
