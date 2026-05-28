'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'

export function MessageComposer({
  endpoint,
  placeholder,
  sendLabel,
}: {
  endpoint: string
  placeholder?: string
  sendLabel?: string
}) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        setText('')
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erro ao enviar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={send} className="mt-3 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? 'Escreva uma mensagem…'}
        className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {sendLabel ?? 'Enviar'}
      </button>
    </form>
  )
}
