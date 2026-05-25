'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

const EMPTY = {
  fullName: '',
  passport: '',
  dateOfBirth: '',
  email: '',
  phone: '',
  whatsapp: '',
  caseType: '',
  assignedTo: '',
}

const FIELD =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15'

export function NewClientDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const set =
    (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/staff/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Cliente cadastrado com sucesso.')
        setOpen(false)
        setForm(EMPTY)
        router.push(`/gestao/clientes/${d.id}`)
      } else {
        toast.error(d.error || 'Não foi possível cadastrar.')
      }
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Plus className="size-4" />
        Novo cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Novo cliente</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Nome completo *
                </label>
                <input required value={form.fullName} onChange={set('fullName')} className={FIELD} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Passaporte *
                  </label>
                  <input
                    required
                    value={form.passport}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, passport: e.target.value.toUpperCase() }))
                    }
                    className={FIELD}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Data de nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dateOfBirth}
                    onChange={set('dateOfBirth')}
                    className={FIELD}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">E-mail</label>
                  <input type="email" value={form.email} onChange={set('email')} className={FIELD} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Telefone</label>
                  <input value={form.phone} onChange={set('phone')} className={FIELD} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    WhatsApp (só números)
                  </label>
                  <input value={form.whatsapp} onChange={set('whatsapp')} className={FIELD} placeholder="5511999999999" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Tipo de caso
                  </label>
                  <input value={form.caseType} onChange={set('caseType')} className={FIELD} placeholder="Ex.: Asylum" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Responsável</label>
                <input value={form.assignedTo} onChange={set('assignedTo')} className={FIELD} placeholder="Deixe em branco para você mesmo" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
