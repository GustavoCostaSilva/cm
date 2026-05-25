import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getClientSession } from '@/lib/server-session'
import { ClientLoginForm } from '@/components/client/ClientLoginForm'
import { ContactFooter } from '@/components/client/ContactFooter'

export default async function ClientLoginPage() {
  const session = await getClientSession()
  if (session) redirect('/meu-caso')

  const office = db.office.get()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2.5 px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#b22234] to-[#1b3a6b] text-xs font-bold text-white">
            GV
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{office.officeName}</p>
            <p className="text-xs text-muted-foreground">{office.attorney}</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <ClientLoginForm />
      </main>

      <ContactFooter office={office} />
    </div>
  )
}
