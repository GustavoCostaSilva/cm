'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CalendarDays, UserCog, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StaffRole } from '@/lib/session'

const ITEMS = [
  { href: '/gestao/painel', label: 'Painel', icon: LayoutDashboard, adminOnly: true },
  { href: '/gestao/clientes', label: 'Clientes', icon: Users, adminOnly: false },
  { href: '/gestao/agenda', label: 'Agenda', icon: CalendarDays, adminOnly: false },
  { href: '/gestao/equipe', label: 'Equipe', icon: UserCog, adminOnly: true },
  { href: '/gestao/config', label: 'Config', icon: Settings, adminOnly: true },
]

export function StaffNav({ role }: { role?: StaffRole }) {
  const path = usePathname()
  return (
    <nav className="flex items-center gap-1">
      {ITEMS.filter((i) => !i.adminOnly || role === 'coordenador').map(
        ({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-secondary text-primary'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          )
        },
      )}
    </nav>
  )
}
