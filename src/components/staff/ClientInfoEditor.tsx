'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Loader2, Check, X } from 'lucide-react'

const FIELD =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15'

export function ClientInfoEditor({
  clientId,
  fullName,
  email,
  phone,
  whatsapp,
  attorneyName,
  managerName,
  createdAtLabel,
}: {
  clientId: string
  fullName: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  attorneyName: string | null
  managerName: string | null
  createdAtLabel: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    fullName,
    email: email ?? '',
    phone: phone ?? '',
    whatsapp: whatsapp ?? '',
  })

  function startEdit() {
    setForm({ fullName, email: email ?? '', phone: phone ?? '', whatsapp: whatsapp ?? '' })
    setEditing(true)
  }

  async function save() {
    if (!form.fullName.trim()) {
      toast.error('O nome não pode ficar vazio.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/staff/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Dados do cliente atualizados.')
        setEditing(false)
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Erro ao salvar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Informações</h2>
        {!editing && (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" />
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <Field label="Nome completo">
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              className={FIELD}
            />
          </Field>
          <Field label="E-mail">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="cliente@email.com"
              className={FIELD}
            />
          </Field>
          <Field label="Telefone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+55 11 90000-0000"
              className={FIELD}
            />
          </Field>
          <Field label="WhatsApp">
            <input
              type="tel"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              placeholder="5511900000000"
              className={FIELD}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary disabled:opacity-50"
            >
              <X className="size-4" />
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <dl className="space-y-2 text-sm">
          <Row label="E-mail" value={email} />
          <Row label="Telefone" value={phone} />
          <Row label="WhatsApp" value={whatsapp} />
          <Row label="Advogado" value={attorneyName} />
          <Row label="Case Manager" value={managerName} />
          <Row label="Cliente desde" value={createdAtLabel} />
        </dl>
      )}
    </section>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value || '—'}</dd>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}
