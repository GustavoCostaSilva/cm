import type { Message } from '@/types'
import { formatDateTime } from '@/lib/case-utils'
import { cn } from '@/lib/utils'

export function MessageThread({
  messages,
  viewer,
}: {
  messages: Message[]
  viewer: 'client' | 'staff'
}) {
  if (messages.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        Nenhuma mensagem ainda. Escreva a primeira abaixo.
      </p>
    )
  }
  return (
    <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
      {messages.map((m) => {
        const mine = m.sender === viewer
        return (
          <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2',
                mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
              )}
            >
              <p className="whitespace-pre-wrap text-sm">{m.text}</p>
              <p className={cn('mt-1 text-[11px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {m.authorName} · {formatDateTime(m.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
