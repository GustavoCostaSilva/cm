import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
import { deleteFile } from '@/lib/storage'
import type { CaseDocument } from '@/types'

export const runtime = 'nodejs'

async function authDoc(
  docId: string,
): Promise<{ doc: CaseDocument } | { error: NextResponse }> {
  const session = await getStaffSession()
  if (!session) return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  const doc = await db.documents.get(docId)
  if (!doc) return { error: NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 }) }
  const client = await db.clients.get(doc.clientId)
  if (!client || !canAccessClient(session, client)) {
    return { error: NextResponse.json({ error: 'Sem permissão' }, { status: 403 }) }
  }
  return { doc }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params
  const a = await authDoc(docId)
  if ('error' in a) return a.error
  const body = await req.json().catch(() => ({}))
  if (typeof body.visibleToClient === 'boolean') {
    await db.documents.setVisible(docId, body.visibleToClient)
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params
  const a = await authDoc(docId)
  if ('error' in a) return a.error
  await db.documents.remove(docId)
  deleteFile(a.doc.clientId, a.doc.storedName)
  return NextResponse.json({ ok: true })
}
