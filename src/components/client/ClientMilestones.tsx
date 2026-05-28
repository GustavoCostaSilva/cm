import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MilestoneView } from '@/lib/case-utils'

export function ClientMilestones({ milestones }: { milestones: MilestoneView[] }) {
  return (
    <ol className="relative">
      {milestones.map((m, i) => {
        const done = m.status === 'done'
        const active = m.status === 'active'
        const last = i === milestones.length - 1
        return (
          <li key={m.key} className="relative flex gap-4 pb-8 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[17px] top-11 h-[calc(100%-2.25rem)] w-0.5',
                  done ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-4 ring-background',
                done && 'bg-primary text-primary-foreground',
                active && 'bg-[#c9a227] text-white',
                !done && !active && 'bg-secondary text-muted-foreground',
              )}
            >
              {done ? <Check className="size-5" /> : i + 1}
            </span>
            <div className="flex-1 pt-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={cn(
                    'font-semibold',
                    done || active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {m.label}
                </h3>
                {active && (
                  <span className="rounded-full bg-[#c9a227]/15 px-2 py-0.5 text-[11px] font-medium text-[#8a6d0f]">
                    Em andamento
                  </span>
                )}
                {done && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    Concluído
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {m.description}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
