import { Check } from 'lucide-react'
import type { StageProgress } from '@/types'
import { STAGE_LABELS, STAGE_DESCRIPTIONS } from '@/types'
import { stageDurationLabel, formatDate } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

export function CaseStepper({
  stages,
  nowIso,
}: {
  stages: StageProgress[]
  nowIso: string
}) {
  const now = new Date(nowIso)

  return (
    <ol className="relative">
      {stages.map((s, i) => {
        const done = s.status === 'done'
        const active = s.status === 'active'
        const last = i === stages.length - 1
        const dur = stageDurationLabel(s, now)

        return (
          <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[15px] top-9 h-[calc(100%-1.75rem)] w-0.5',
                  done ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-background',
                done && 'bg-primary text-primary-foreground',
                active && 'bg-[#c9a227] text-white',
                !done && !active && 'bg-secondary text-muted-foreground',
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>

            <div className="flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={cn(
                    'text-sm font-semibold',
                    done || active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {STAGE_LABELS[s.key]}
                </h3>
                {active && (
                  <span className="rounded-full bg-[#c9a227]/15 px-2 py-0.5 text-[11px] font-medium text-[#8a6d0f]">
                    Em andamento
                  </span>
                )}
                {done && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    Concluída
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {STAGE_DESCRIPTIONS[s.key]}
              </p>

              {(s.startedAt || dur) && (
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  {s.startedAt && <span>Início: {formatDate(s.startedAt)}</span>}
                  {done && s.completedAt && (
                    <span>Conclusão: {formatDate(s.completedAt)}</span>
                  )}
                  {dur && (
                    <span className="font-medium text-foreground">
                      {done ? 'Durou' : 'Há'} {dur}
                    </span>
                  )}
                </div>
              )}

              {done && s.note && (
                <p className="mt-1.5 rounded-md bg-secondary/60 px-2.5 py-1.5 text-xs text-foreground">
                  {s.note}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
