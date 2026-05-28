'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CHECKLISTS, type ChecklistItem, type VisaType } from '@/types'
import { cn } from '@/lib/utils'

export function ChecklistManager({
  clientId,
  visa,
  done,
}: {
  clientId: string
  visa: VisaType | null
  done: string[]
}) {
  const router = useRouter()
  const [checked, setChecked] = useState<Set<string>>(new Set(done))
  const [busy, setBusy] = useState(false)

  if (!visa) {
    return (
      <p className="text-sm text-muted-foreground">
        Defina o tipo de visto do cliente para ver o checklist de formulários e documentos.
      </p>
    )
  }

  const cl = CHECKLISTS[visa]
  const all = [...cl.forms, ...cl.docs]
  const doneCount = all.filter((i) => checked.has(i.id)).length

  async function toggle(id: string) {
    const prev = checked
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
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

  const group = (title: string, items: ChecklistItem[]) => (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((it) => (
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

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{visa}</span>
        <span className="text-sm font-medium text-foreground">
          {doneCount}/{all.length}
        </span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${Math.round((doneCount / all.length) * 100)}%` }}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {group('Formulários', cl.forms)}
        {group('Documentos', cl.docs)}
      </div>
    </div>
  )
}
