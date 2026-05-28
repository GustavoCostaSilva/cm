'use client'

import { AlertTriangle } from 'lucide-react'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="text-xl font-bold text-foreground">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Tivemos um problema ao carregar esta página. Tente novamente em instantes.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Tentar novamente
      </button>
    </div>
  )
}
