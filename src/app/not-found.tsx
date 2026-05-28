import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-5 text-center">
      <p className="text-5xl font-extrabold tracking-tight text-primary">404</p>
      <h1 className="text-xl font-bold text-foreground">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="mt-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
