import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
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
  const client = await db.clients.get(id)
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  if (!canAccessClient(session, client)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

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
  const mailStageKey: StageKey | null = stageKey ?? null
  let mailMessage = message

  const findStage = (k: StageKey) => stages.find((st) => st.key === k)

  // Eligibility gate (manual §5.2): the case cannot progress beyond the
  // eligibility analysis until the client is confirmed eligible. Block
  // starting/completing any stage from "analise" onward while eligibility
  // is still pending or marked ineligible.
  const ELIGIBILITY_GATE_FROM = STAGE_KEYS.indexOf('analise')
  if ((action === 'start' || action === 'complete') && stageKey) {
    const idx = STAGE_KEYS.indexOf(stageKey)
    if (idx >= ELIGIBILITY_GATE_FROM && client.eligibility !== 'eligible') {
      return NextResponse.json(
        {
          error:
            'Elegibilidade ainda não confirmada. Conclua a análise de elegibilidade e marque o cliente como "Elegível" antes de avançar para esta etapa (manual §5.2).',
        },
        { status: 422 },
      )
    }
  }

  if (action === 'start') {
    if (!stageKey || !findStage(stageKey)) {
      return NextResponse.json({ error: 'Etapa inválida.' }, { status: 400 })
    }
    const st = findStage(stageKey)!
    st.status = 'active'
    if (!st.startedAt) st.startedAt = now
    st.completedAt = null
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
    const st = findStage(stageKey)!
    st.status = 'done'
    if (!st.startedAt) st.startedAt = now
    st.completedAt = now
    if (message) st.note = message
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
      // Don't auto-advance into an eligibility-gated stage until the client
      // is confirmed eligible (manual §5.2).
      const nkGated =
        STAGE_KEYS.indexOf(nk) >= ELIGIBILITY_GATE_FROM && client.eligibility !== 'eligible'
      if (ns.status === 'pending' && !nkGated) {
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

  if (action === 'start' || action === 'complete') {
    await db.clients.update(client.id, { stages })
  }
  for (const e of newEvents) await db.events.add(e)

  let mail: { delivered: boolean; dev: boolean } | null = null
  if (mailKind && client.email) {
    const origin = new URL(req.url).origin
    const office = await db.office.get()
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
