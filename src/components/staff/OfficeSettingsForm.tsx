'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import type { OfficeConfig } from '@/types'

const FIELD =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15'

export function OfficeSettingsForm({ office }: { office: OfficeConfig }) {
  const router = useRouter()
  const [form, setForm] = useState({
    officeName: office.officeName,
    attorney: office.attorney,
    phone: office.phone,
    whatsapp: office.whatsapp,
    email: office.email,
    addressLine: office.addressLine ?? '',
    disclaimerText: office.disclaimerText,
  })
  const [busy, setBusy] = useState(false)
  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/staff/office', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Configurações salvas.')
        router.refresh()
      } else {
        toast.error(d.error || 'Erro ao salvar.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight text-foreground">Configurações do escritório</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Estes dados aparecem no rodapé e nos e-mails enviados aos clientes.
      </p>

      <form onSubmit={save} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Nome do escritório</label>
            <input value={form.officeName} onChange={set('officeName')} className={FIELD} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Advogado responsável</label>
            <input value={form.attorney} onChange={set('attorney')} className={FIELD} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Telefone</label>
            <input value={form.phone} onChange={set('phone')} className={FIELD} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">WhatsApp (só números)</label>
            <input value={form.whatsapp} onChange={set('whatsapp')} className={FIELD} placeholder="13055550142" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">E-mail</label>
            <input type="email" value={form.email} onChange={set('email')} className={FIELD} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Endereço</label>
            <input value={form.addressLine} onChange={set('addressLine')} className={FIELD} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Texto do disclaimer (rodapé)</label>
          <textarea
            value={form.disclaimerText}
            onChange={set('disclaimerText')}
            rows={4}
            className={FIELD + ' resize-none'}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
