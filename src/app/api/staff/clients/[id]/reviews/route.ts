import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
import {
  BLOCKING_SEVERITIES,
  MAX_REVIEW_ROUNDS,
  type CaseEvent,
  type CaseReview,
  type ErrorSeverity,
  type ReviewError,
} from '@/types'

const SEVERITIES: ErrorSeverity[] = ['critical', 'moderate', 'cosmetic']

// Record a technical review (manual §Etapa 7 / §10.1).
// Only the Revisor Técnico or the Coordenador may submit one.
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
  if (session.role !== 'revisor_tecnico' && session.role !== 'coordenador') {
    return NextResponse.json(
      { error: 'Apenas o Revisor Técnico ou o Coordenador podem registrar a revisão.' },
      { status: 403 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const outcome = body.outcome === 'approved' ? 'approved' : body.outcome === 'returned' ? 'returned' : null
  if (!outcome) {
    return NextResponse.json({ error: 'Resultado inválido.' }, { status: 400 })
  }

  // Normalize errors.
  const rawErrors = Array.isArray(body.errors) ? body.errors : []
  const errors: ReviewError[] = rawErrors
    .filter((e: unknown): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map((e: Record<string, unknown>) => ({
      severity: (SEVERITIES.includes(e.severity as ErrorSeverity) ? e.severity : 'moderate') as ErrorSeverity,
      field: String(e.field ?? '').trim().slice(0, 160),
      note: String(e.note ?? '').trim().slice(0, 600),
    }))
    .filter((e: ReviewError) => e.field || e.note)

  const blocking = errors.filter((e) => BLOCKING_SEVERITIES.includes(e.severity))

  if (outcome === 'approved' && blocking.length > 0) {
    return NextResponse.json(
      {
        error:
          'Não é possível aprovar: há apontamento(s) crítico(s)/moderado(s) pendente(s). Devolva o caso para correção (manual §Etapa 7 / §10.1).',
      },
      { status: 422 },
    )
  }
  if (outcome === 'returned' && errors.length === 0) {
    return NextResponse.json(
      { error: 'Liste ao menos um apontamento para devolver o caso à correção.' },
      { status: 422 },
    )
  }

  const prior = await db.reviews.byClient(id)
  const round = prior.length + 1
  const author = session.name || 'Revisor'
  const now = new Date().toISOString()

  const review: CaseReview = {
    id: randomUUID(),
    clientId: id,
    round,
    reviewer: author,
    outcome,
    errors,
    createdAt: now,
  }
  await db.reviews.add(review)

  const addEvent = (e: Omit<CaseEvent, 'id' | 'clientId'>) =>
    db.events.add({ id: randomUUID(), clientId: id, ...e })

  const crit = errors.filter((e) => e.severity === 'critical').length
  const mod = errors.filter((e) => e.severity === 'moderate').length
  const cos = errors.filter((e) => e.severity === 'cosmetic').length

  if (outcome === 'approved') {
    await addEvent({
      stageKey: 'revisao',
      type: 'note',
      text:
        `Revisão técnica APROVADA (rodada ${round}) por ${author}.` +
        (cos > 0 ? ` ${cos} ajuste(s) cosmético(s) registrado(s).` : ''),
      author,
      createdAt: now,
      visibleToClient: false,
      notified: false,
    })
  } else {
    await addEvent({
      stageKey: 'revisao',
      type: 'flag',
      text: `Revisão devolvida para correção (rodada ${round}): ${errors.length} apontamento(s) — ${crit} crítico(s), ${mod} moderado(s), ${cos} cosmético(s).`,
      author,
      createdAt: now,
      visibleToClient: false,
      notified: false,
    })
  }

  // Round limit (manual §Etapa 7): up to MAX_REVIEW_ROUNDS returns; the next
  // return escalates to the coordinator for evaluation / reassignment.
  const returnsSoFar = prior.filter((r) => r.outcome === 'returned').length + (outcome === 'returned' ? 1 : 0)
  const escalated = outcome === 'returned' && returnsSoFar > MAX_REVIEW_ROUNDS
  if (escalated) {
    await addEvent({
      stageKey: 'revisao',
      type: 'flag',
      text: `⚠️ ${returnsSoFar}ª devolução — caso escalado ao Coordenador para avaliação e possível reatribuição (manual §Etapa 7).`,
      author,
      createdAt: now,
      visibleToClient: false,
      notified: false,
    })
  }

  return NextResponse.json({ ok: true, round, outcome, escalated })
}
