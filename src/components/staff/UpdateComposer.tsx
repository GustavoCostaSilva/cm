'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { STAGE_KEYS, STAGE_LABELS, type StageKey } from '@/types'

export function UpdateComposer({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [stageKey, setStageKey] = useState<StageKey | ''>('')
  const [isFlag, setIsFlag] = useState(false)
  const [visible, setVisible] = useState(true)
  const [notify, setNotify] = useState(false)
  const [busy, setBusy] = useState(false)

  const effectiveVisible = isFlag ? true : visible
  const effectiveNotify = isFlag ? true : notify

  async function submit() {
    if (!message.trim()) {
      toast.error('Escreva uma mensagem.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isFlag ? 'flag' : 'note',
          stageKey: stageKey || undefined,
          message,
          notify: effectiveNotify,
          visibleToClient: effectiveVisible,
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(d.error || 'Não foi possível registrar.')
        return
      }
      const mailNote = d.mail?.dev
        ? ' (e-mail simulado no console)'
        : d.notified
          ? ' e cliente notificado'
          : ''
      toast.success((isFlag ? 'Sinalização registrada' : 'Atualização registrada') + mailNote)
      setMessage('')
      setIsFlag(false)
      setStageKey('')
      router.refresh()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Descreva uma atualização ou sinalização sobre o caso..."
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <label className="flex items-center gap-1.5 text-foreground">
          Etapa:
          <select
            value={stageKey}
            onChange={(e) => setStageKey(e.target.value as StageKey | '')}
            className="rounded-md border border-input bg-card px-2 py-1 text-xs outline-none focus:border-primary"
          >
            <option value="">Geral</option>
            {STAGE_KEYS.map((k) => (
              <option key={k} value={k}>
                {STAGE_LABELS[k]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-foreground">
          <input
            type="checkbox"
            checked={isFlag}
            onChange={(e) => setIsFlag(e.target.checked)}
            className="size-3.5 accent-[#b22234]"
          />
          Sinalização importante
        </label>

        <label className="flex items-center gap-1.5 text-foreground">
          <input
            type="checkbox"
            checked={effectiveVisible}
            disabled={isFlag}
            onChange={(e) => setVisible(e.target.checked)}
            className="size-3.5 accent-[#1b3a6b] disabled:opacity-50"
          />
          Visível ao cliente
        </label>

        <label className="flex items-center gap-1.5 text-foreground">
          <input
            type="checkbox"
            checked={effectiveNotify}
            disabled={isFlag}
            onChange={(e) => setNotify(e.target.checked)}
            className="size-3.5 accent-[#1b3a6b] disabled:opacity-50"
          />
          Notificar por e-mail
        </label>

        <button
          onClick={submit}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Registrar
        </button>
      </div>
    </div>
  )
}
