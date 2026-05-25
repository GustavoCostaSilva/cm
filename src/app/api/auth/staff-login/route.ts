import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { signStaff, STAFF_COOKIE } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
  }
  const user = db.staff.getByEmail(String(email))
  if (!user || !user.active || !verifyPassword(String(password), user.passwordHash)) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
  }
  const token = await signStaff({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
  const res = NextResponse.json({
    ok: true,
    user: { name: user.name, role: user.role },
  })
  res.cookies.set(STAFF_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
