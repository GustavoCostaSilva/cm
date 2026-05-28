'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Scale, Loader2, Lock } from 'lucide-react'

export function StaffLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const d = await res.json().catch(() => ({}))
        const next = new URLSearchParams(window.location.search).get('next')
        const dest = next || (d.user?.role === 'coordenador' ? '/gestao/painel' : '/gestao/clientes')
        router.push(dest)
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Falha no login.')
      }
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#b22234]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#1b3a6b]" />
        </div>

        <div className="px-8 pt-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#b22234] to-[#1b3a6b] shadow-sm ring-1 ring-black/5">
            <Scale className="size-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#0f1b2d]">
            Case Management
          </h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-[#5b6b82]">
            Go Visa Law Firm
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-8 py-7">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1b3a6b]">E-mail</label>
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#dde4ef] px-3.5 py-2.5 text-sm text-[#0f1b2d] outline-none focus:border-[#1b3a6b] focus:ring-2 focus:ring-[#1b3a6b]/15"
              placeholder="voce@govisa.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1b3a6b]">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#dde4ef] px-3.5 py-2.5 text-sm text-[#0f1b2d] outline-none focus:border-[#1b3a6b] focus:ring-2 focus:ring-[#1b3a6b]/15"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-[#b22234]/30 bg-[#fdeaec] px-3 py-2 text-sm text-[#b22234]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1b3a6b] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#142d54] disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
            Entrar
          </button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs text-white/60">
        Área restrita à equipe · Go Visa Law Firm
      </p>
    </div>
  )
}
