import { formatDistanceStrict, format, differenceInCalendarDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client, StageProgress, StageKey } from '@/types'
import { STAGE_KEYS } from '@/types'

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

export function stageLabelByKey(key: StageKey): string {
  return STAGE_KEYS.includes(key) ? key : key
}
