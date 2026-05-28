'use client'

import { useRouter } from 'next/navigation'
import { LOCALES, LOCALE_NAMES, LOCALE_COOKIE, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter()
  function set(l: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-medium transition-colors',
            current === l ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  )
}
