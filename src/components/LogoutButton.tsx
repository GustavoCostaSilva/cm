'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton({
  endpoint,
  redirectTo,
  label = 'Sair',
}: {
  endpoint: string
  redirectTo: string
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    await fetch(endpoint, { method: 'POST' }).catch(() => {})
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="size-4" />
      {label}
    </button>
  )
}
