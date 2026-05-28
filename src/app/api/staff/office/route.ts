import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import type { OfficeConfig } from '@/types'

// Save office configuration (admin only).
export async function PUT(req: NextRequest) {
  const session = await getStaffSession()
  if (!session || session.role !== 'coordenador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v.trim() : fallback)

  const current = await db.office.get()
  const cfg: OfficeConfig = {
    officeName: str(body.officeName) || current.officeName,
    attorney: str(body.attorney) || current.attorney,
    phone: str(body.phone) || current.phone,
    whatsapp: str(body.whatsapp).replace(/\D/g, '') || current.whatsapp,
    email: str(body.email) || current.email,
    addressLine: str(body.addressLine) || null,
    disclaimerText: str(body.disclaimerText) || current.disclaimerText,
  }
  await db.office.save(cfg)
  return NextResponse.json({ ok: true })
}
