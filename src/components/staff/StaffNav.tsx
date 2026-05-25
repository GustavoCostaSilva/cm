'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/gestao/clientes', label: 'Clientes', icon: Users },
  { href: '/gestao/agenda', label: 'Agenda', icon: CalendarDays },
]

export function StaffNav() {
  const path = usePathname()
  return (
    <nav className="flex items-center gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
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
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
