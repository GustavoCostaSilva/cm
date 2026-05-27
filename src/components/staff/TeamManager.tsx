'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, X, KeyRound } from 'lucide-react'
import type { StaffUser } from '@/types'
import { cn } from '@/lib/utils'

const FIELD =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15'

const ROLE_LABEL = { admin: 'Admin / Gerência', case_manager: 'Case Manager' } as const

export function TeamManager({
  staff,
  clientCounts,
  selfId,
}: {
  staff: StaffUser[]
  clientCounts: Record<string, number>
  selfId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'case_manager' })
  const [busy, setBusy] = useState(false)
  const [resetFor, setResetFor] = useState<string | null>(null)
  const [newPw, setNewPw] = useState('')

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/staff/team/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      router.refresh()
      return true
    }
    toast.error(d.error || 'Erro ao atualizar.')
    return false
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/staff/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success('Membro adicionado.')
        setOpen(false)
        setForm({ name: '', email: '', password: '', role: 'case_manager' })
        router.refresh()
      } else {
        toast.error(d.error || 'Erro ao adicionar.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function doReset(id: string) {
    if (newPw.length < 6) {
      toast.error('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (await patch(id, { password: newPw })) {
      toast.success('Senha redefinida.')
      setResetFor(null)
      setNewPw('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Equipe</h1>
          <p className="text-sm text-muted-foreground">{staff.length} membro(s)</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Novo membro
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Membro</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Clientes</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => patch(u.id, { role: e.target.value })}
                      disabled={u.id === selfId}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary disabled:opacity-60"
                    >
                      <option value="case_manager">{ROLE_LABEL.case_manager}</option>
                      <option value="admin">{ROLE_LABEL.admin}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.role === 'admin' ? '—' : (clientCounts[u.id] ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => patch(u.id, { active: !u.active })}
                      disabled={u.id === selfId}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium disabled:opacity-60',
                        u.active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-secondary text-muted-foreground',
                      )}
                    >
                      {u.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {resetFor === u.id ? (
                      <span className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          placeholder="Nova senha"
                          className="w-28 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                        />
                        <button onClick={() => doReset(u.id)} className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                          OK
                        </button>
                        <button onClick={() => { setResetFor(null); setNewPw('') }} className="text-muted-foreground hover:text-foreground">
                          <X className="size-4" />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setResetFor(u.id)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <KeyRound className="size-3.5" />
                        Redefinir senha
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">Novo membro</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-secondary">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={create} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Nome *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={FIELD} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">E-mail *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={FIELD} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Senha * (mín. 6)</label>
                <input type="text" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className={FIELD} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Papel</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={FIELD}>
                  <option value="case_manager">{ROLE_LABEL.case_manager}</option>
                  <option value="admin">{ROLE_LABEL.admin}</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {busy && <Loader2 className="size-4 animate-spin" />}
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
