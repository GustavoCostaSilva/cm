import { formatDistanceStrict, format, differenceInCalendarDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client, StageProgress, StageKey } from '@/types'
import { STAGE_SLA_HOURS, CLIENT_MILESTONES } from '@/types'

// Index of the stage the client is currently on.
export function currentStageIndex(client: Client): number {
  const active = client.stages.findIndex((s) => s.status === 'active')
  if (active >= 0) return active
  // No active stage: point at the last completed one, or the first pending.
  for (let i = client.stages.length - 1; i >= 0; i--) {
    if (client.stages[i].status === 'done') return i
  }
  return 0
}

export function currentStage(client: Client): StageProgress {
  return client.stages[currentStageIndex(client)]
}

export function isCaseComplete(client: Client): boolean {
  return client.stages.every((s) => s.status === 'done')
}

export function progressPercent(client: Client): number {
  const done = client.stages.filter((s) => s.status === 'done').length
  const hasActive = client.stages.some((s) => s.status === 'active')
  const credit = done + (hasActive ? 0.5 : 0)
  return Math.round((credit / client.stages.length) * 100)
}

// Human label for how long a stage has lasted (or is lasting).
export function stageDurationLabel(stage: StageProgress, now: Date = new Date()): string | null {
  if (!stage.startedAt) return null
  const start = parseISO(stage.startedAt)
  const end = stage.completedAt ? parseISO(stage.completedAt) : now
  return formatDistanceStrict(end, start, { locale: ptBR })
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return iso
  }
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  try {
    return formatDistanceStrict(parseISO(iso), now, { addSuffix: true, locale: ptBR })
  } catch {
    return iso
  }
}

// Days until a deadline (negative = overdue).
export function daysUntil(dueDate: string, now: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(dueDate), now)
}

// ── Client-facing milestones (group the 11 internal stages) ──
export type MilestoneStatus = 'done' | 'active' | 'pending'
export interface MilestoneView {
  key: string
  label: string
  description: string
  status: MilestoneStatus
}

export function clientMilestones(client: Client): MilestoneView[] {
  const byKey = new Map(client.stages.map((s) => [s.key, s.status]))
  return CLIENT_MILESTONES.map((m) => {
    const statuses = m.stages.map((k) => byKey.get(k) ?? 'pending')
    const allDone = statuses.every((st) => st === 'done')
    const anyStarted = statuses.some((st) => st === 'active' || st === 'done')
    const status: MilestoneStatus = allDone ? 'done' : anyStarted ? 'active' : 'pending'
    return { key: m.key, label: m.label, description: m.description, status }
  })
}

// ── SLA helpers (only meaningful for the active stage) ──
export function slaDueDate(stage: StageProgress, urgent: boolean): Date | null {
  if (!stage.startedAt || stage.status !== 'active') return null
  const hours = STAGE_SLA_HOURS[stage.key]?.[urgent ? 'urgent' : 'normal'] ?? 0
  if (!hours) return null
  return new Date(new Date(stage.startedAt).getTime() + hours * 3600_000)
}

export function slaState(
  stage: StageProgress,
  urgent: boolean,
  now: Date = new Date(),
): 'ok' | 'due_soon' | 'overdue' | null {
  const due = slaDueDate(stage, urgent)
  if (!due) return null
  const diffH = (due.getTime() - now.getTime()) / 3600_000
  if (diffH < 0) return 'overdue'
  if (diffH < 12) return 'due_soon'
  return 'ok'
}
