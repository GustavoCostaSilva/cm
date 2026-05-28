import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { hashPassword } from '@/lib/auth'
import { STAFF_ROLES, type StaffUser } from '@/types'

// Update a staff member: name, role, active, or reset password (coordenador only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession()
  if (!session || session.role !== 'coordenador') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  const { id } = await params
  const target = await db.staff.get(id)
  if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const patch: Partial<StaffUser> = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
  if (typeof body.role === 'string' && STAFF_ROLES.includes(body.role)) patch.role = body.role
  if (typeof body.active === 'boolean') patch.active = body.active
  if (typeof body.password === 'string' && body.password.length >= 6) {
    patch.passwordHash = hashPassword(body.password)
  }

  // Don't let a coordenador lock themselves out by self-deactivating or self-demoting.
  if (
    id === session.sub &&
    (patch.active === false || (patch.role !== undefined && patch.role !== 'coordenador'))
  ) {
    return NextResponse.json(
      { error: 'Você não pode desativar ou rebaixar a própria conta.' },
      { status: 400 },
    )
  }

  await db.staff.update(id, patch)
  return NextResponse.json({ ok: true })
}
