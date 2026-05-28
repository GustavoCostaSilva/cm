'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CONFERENCE_CHECKLISTS } from '@/types'
import { cn } from '@/lib/utils'

// Signature (§Etapa 6) and final-validation (§Etapa 9) conference checklists.
// Items are stored together with the visa checklist in Client.checklistDone.
export function ConferenceChecklists({
  clientId,
  done,
}: {
  clientId: string
  done: string[]
}) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(new Set(done))
  const [busy, setBusy] = useState(false)

  async function toggle(itemId: string) {
    const prev = checked
    const next = new Set(checked)
    if (next.has(itemId)) next.delete(itemId)
    else next.add(itemId)
    setChecked(next)
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistDone: [...next] }),
      })
      if (!res.ok) {
        toast.error('Erro ao salvar.')
        setChecked(prev)
      }
    } catch {
      toast.error('Erro de conexão.')
      setChecked(prev)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {CONFERENCE_CHECKLISTS.map((g) => {
        const total = g.items.length
        const doneCount = g.items.filter((i) => checked.has(i.id)).length
        const pct = Math.round((doneCount / total) * 100)
        return (
          <div key={g.key}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {g.title}
              </h3>
              <span className="text-sm font-medium text-foreground">
                {doneCount}/{total}
              </span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn('h-full transition-all', pct === 100 ? 'bg-emerald-500' : 'bg-primary')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <ul className="space-y-1.5">
              {g.items.map((it) => (
                <li key={it.id}>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked.has(it.id)}
                      disabled={busy}
                      onChange={() => toggle(it.id)}
                      className="mt-0.5 size-4 accent-[#1b3a6b]"
                    />
                    <span className={cn(checked.has(it.id) && 'text-muted-foreground line-through')}>
                      {it.label}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
