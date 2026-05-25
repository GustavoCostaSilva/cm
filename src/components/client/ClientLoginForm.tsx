'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ScrollText, Loader2, ArrowRight } from 'lucide-react'

export function ClientLoginForm() {
  const router = useRouter()
  const [passport, setPassport] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/client-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passport, dob }),
      })
      if (res.ok) {
        router.push('/meu-caso')
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Não foi possível entrar.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-black/5">
        <div className="flex h-1.5">
          <div className="flex-1 bg-[#b22234]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#1b3a6b]" />
        </div>

        <div className="px-8 pt-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#b22234] to-[#1b3a6b] shadow-sm ring-1 ring-black/5">
            <ScrollText className="size-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Portal do Cliente
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o andamento do seu caso
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-8 py-7">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">
              Número do passaporte
            </label>
            <input
              type="text"
              autoFocus
              required
              autoCapitalize="characters"
              value={passport}
              onChange={(e) => setPassport(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Ex.: FN481223"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary">
              Data de nascimento
            </label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Sua data de nascimento é a sua senha de acesso.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            Acessar meu caso
          </button>
        </form>
      </div>
    </div>
  )
}
