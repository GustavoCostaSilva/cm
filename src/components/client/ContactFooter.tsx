import { MessageCircle, Phone, Mail, ShieldCheck } from 'lucide-react'
import type { OfficeConfig } from '@/types'
import type { Dict } from '@/lib/i18n'

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`
}

export function ContactFooter({ office, t }: { office: OfficeConfig; t?: Dict }) {
  const year = new Date().getFullYear()
  const waHref = `https://wa.me/${office.whatsapp}`

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-8">
        <div className="flex items-start gap-3 rounded-xl border border-primary/10 bg-secondary/60 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">{office.disclaimerText}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 px-4 py-3 transition-colors hover:bg-[#25D366]/10"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#25D366]/15 text-[#1ba94c]">
              <MessageCircle className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t?.fWhatsapp ?? 'WhatsApp'}
              </span>
              <span className="block truncate text-sm font-semibold text-foreground">{office.whatsapp ? 'WhatsApp' : '—'}</span>
            </span>
          </a>

          <a
            href={telHref(office.phone)}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t?.fPhone ?? 'Telefone'}
              </span>
              <span className="block truncate text-sm font-semibold text-foreground">{office.phone}</span>
            </span>
          </a>

          <a
            href={`mailto:${office.email}`}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t?.fEmail ?? 'E-mail'}
              </span>
              <span className="block truncate text-sm font-semibold text-foreground">{office.email}</span>
            </span>
          </a>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {year} {office.officeName} · {office.attorney}
          {office.addressLine ? ` · ${office.addressLine}` : ''}
        </p>
      </div>
    </footer>
  )
}
