import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { hashPassword } from '@/lib/auth'
import type { StaffUser, StaffRole } from '@/types'

// Create a staff member (admin only).
export async function POST(req: NextRequest) {
  const session = await getStaffSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const role: StaffRole = body.role === 'admin' ? 'admin' : 'case_manager'

  if (!name || !email || password.length < 6) {
    return NextResponse.json(
      { error: 'Nome, e-mail e senha (mín. 6 caracteres) são obrigatórios.' },
      { status: 400 },
    )
  }
  if (await db.staff.getByEmail(email)) {
    return NextResponse.json({ error: 'Já existe um usuário com este e-mail.' }, { status: 409 })
  }

  const user: StaffUser = {
    id: `staff_${Date.now().toString(36)}`,
    email,
    passwordHash: hashPassword(password),
    name,
    role,
    active: true,
    createdAt: new Date().toISOString(),
  }
  await db.staff.create(user)
  return NextResponse.json({ ok: true, id: user.id }, { status: 201 })
}
