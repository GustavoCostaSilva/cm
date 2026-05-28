'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AgendaItem {
  id: string
  clientId: string
  clientName: string
  title: string
  dueDate: string
  status: 'pending' | 'done'
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function chipTone(item: AgendaItem, todayYmd: string): string {
  if (item.status === 'done') return 'bg-emerald-100 text-emerald-700 line-through'
  const due = item.dueDate.slice(0, 10)
  if (due < todayYmd) return 'bg-destructive/10 text-destructive'
  return 'bg-primary/10 text-primary'
}

export function AgendaCalendar({ items }: { items: AgendaItem[] }) {
  const router = useRouter()
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<string | null>(null)
  const today = new Date()
  const todayYmd = format(today, 'yyyy-MM-dd')

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const byDay = useMemo(() => {
    const m = new Map<string, AgendaItem[]>()
    for (const it of items) {
      const k = it.dueDate.slice(0, 10)
      const arr = m.get(k) ?? []
      arr.push(it)
      m.set(k, arr)
    }
    return m
  }, [items])

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold capitalize text-foreground">
          {format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            Hoje
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Próximo mês"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-secondary py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {w}
          </div>
        ))}
        {days.map((day) => {
          const ymd = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, cursor)
          const isToday = isSameDay(day, today)
          const dayItems = byDay.get(ymd) ?? []
          return (
            <div
              key={ymd}
              onClick={() => setSelected(ymd)}
              className={cn(
                'min-h-[58px] cursor-pointer bg-card p-1.5 text-left align-top transition-colors hover:bg-secondary/40 sm:min-h-[92px]',
                !inMonth && 'bg-secondary/30',
              )}
            >
              <div
                className={cn(
                  'mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs',
                  isToday ? 'bg-primary font-semibold text-primary-foreground' : 'text-muted-foreground',
                  !inMonth && 'opacity-40',
                )}
              >
                {format(day, 'd')}
              </div>
              {dayItems.length > 0 && (
                <span
                  className={cn(
                    'inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold sm:hidden',
                    dayItems.some((it) => it.status !== 'done' && it.dueDate.slice(0, 10) < todayYmd)
                      ? 'bg-destructive/15 text-destructive'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {dayItems.length}
                </span>
              )}
              <div className="hidden space-y-1 sm:block">
                {dayItems.slice(0, 3).map((it) => (
                  <button
                    key={it.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/gestao/clientes/${it.clientId}`)
                    }}
                    title={`${it.clientName} — ${it.title}`}
                    className={cn(
                      'block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80',
                      chipTone(it, todayYmd),
                    )}
                  >
                    {it.clientName.split(' ')[0]}: {it.title}
                  </button>
                ))}
                {dayItems.length > 3 && (
                  <span className="block px-1.5 text-[11px] font-medium text-muted-foreground">
                    +{dayItems.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary/40" /> Pendente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/40" /> Vencido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-300" /> Concluído
        </span>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h3 className="text-sm font-semibold capitalize text-foreground">
                {format(new Date(selected + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4">
              {(byDay.get(selected) ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum prazo neste dia.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(byDay.get(selected) ?? []).map((it) => {
                    const overdue = it.status !== 'done' && it.dueDate.slice(0, 10) < todayYmd
                    return (
                      <li key={it.id}>
                        <button
                          onClick={() => {
                            setSelected(null)
                            router.push(`/gestao/clientes/${it.clientId}`)
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:bg-secondary"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-foreground">
                              {it.clientName}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">{it.title}</div>
                          </div>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                              it.status === 'done'
                                ? 'bg-emerald-100 text-emerald-700'
                                : overdue
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-primary/10 text-primary',
                            )}
                          >
                            {it.status === 'done' ? 'Concluído' : overdue ? 'Vencido' : 'Pendente'}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
