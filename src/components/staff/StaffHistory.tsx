import {
  Sparkles,
  FileText,
  PlayCircle,
  CheckCircle2,
  Flag,
  CalendarClock,
} from 'lucide-react'
import type { CaseEvent, CaseEventType } from '@/types'
import { formatDateTime } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

const ICONS: Record<CaseEventType, typeof FileText> = {
  created: Sparkles,
  note: FileText,
  stage_started: PlayCircle,
  stage_completed: CheckCircle2,
  flag: Flag,
  deadline: CalendarClock,
  uscis_letter: FileText,
}

function tone(type: CaseEventType): string {
  if (type === 'stage_completed') return 'bg-primary/10 text-primary'
  if (type === 'flag') return 'bg-destructive/10 text-destructive'
  if (type === 'created') return 'bg-[#c9a227]/15 text-[#8a6d0f]'
  return 'bg-secondary text-muted-foreground'
}

export function StaffHistory({ events }: { events: CaseEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhum evento registrado ainda.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {events.map((e) => {
        const Icon = ICONS[e.type] ?? FileText
        return (
          <li key={e.id} className="flex gap-3">
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full',
                tone(e.type),
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="flex-1 border-b border-border pb-4">
              <p className="text-sm text-foreground">{e.text}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {e.author} · {formatDateTime(e.createdAt)}
                </span>
                {!e.visibleToClient && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-muted-foreground">
                    Interno
                  </span>
                )}
                {e.notified && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                    Notificado
                  </span>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
