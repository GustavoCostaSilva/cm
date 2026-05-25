import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { normalizeDob } from '@/lib/auth'
import { signClient, CLIENT_COOKIE } from '@/lib/session'
import { checkRateLimit, registerFailure, resetRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const { passport, dob } = await req.json().catch(() => ({}))
  if (!passport || !dob) {
    return NextResponse.json(
      { error: 'Informe o passaporte e a data de nascimento.' },
      { status: 400 },
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const key = `${String(passport).toLowerCase()}|${ip}`

  const rl = checkRateLimit(key)
  if (rl.blocked) {
    const min = Math.max(1, Math.ceil(rl.retryAfterSec / 60))
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${min} min.` },
      { status: 429 },
    )
  }

  const client = db.clients.getByPassport(String(passport))
  const dobNorm = normalizeDob(String(dob))
  if (!client || client.dateOfBirth !== dobNorm) {
    registerFailure(key)
    return NextResponse.json(
      { error: 'Passaporte ou data de nascimento inválidos.' },
      { status: 401 },
    )
  }

  resetRateLimit(key)
  const token = await signClient({
    sub: client.id,
    passport: client.passport,
    name: client.fullName,
  })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(CLIENT_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
