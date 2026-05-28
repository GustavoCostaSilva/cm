import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'
import { StaffNav } from './StaffNav'
import { StaffNotifier } from './StaffNotifier'
import type { StaffRole } from '@/lib/session'

export function StaffShell({
  staffName,
  role,
  children,
}: {
  staffName: string
  role?: StaffRole
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-5">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/gestao/clientes" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#b22234] to-[#1b3a6b] text-xs font-bold text-white">
                GV
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">Go Visa Law Firm</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Case Management
                </p>
              </div>
            </Link>
            <StaffNav role={role} />
          </div>
          <div className="flex items-center gap-2">
            <StaffNotifier />
            <span className="hidden text-sm text-muted-foreground md:inline">{staffName}</span>
            <LogoutButton endpoint="/api/auth/staff-logout" redirectTo="/gestao" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-7">{children}</main>
    </div>
  )
}
