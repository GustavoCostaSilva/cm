import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getStaffSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
import { saveFile } from '@/lib/storage'
import type { CaseDocument } from '@/types'

export const runtime = 'nodejs'
const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = await params
  const client = await db.clients.get(id)
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
  if (!canAccessClient(session, client)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo excede 20 MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const docId = randomUUID()
  const safeName = file.name.replace(/[^\w.\- ]/g, '_').slice(0, 120) || 'arquivo'
  const storedName = `${docId}__${safeName}`
  saveFile(id, storedName, buffer)

  const doc: CaseDocument = {
    id: docId,
    clientId: id,
    category: (form?.get('category') as string) || null,
    originalName: file.name,
    storedName,
    mime: file.type || null,
    sizeBytes: file.size,
    uploadedBy: session.name || 'Equipe',
    uploadedAt: new Date().toISOString(),
    visibleToClient: form?.get('visibleToClient') === 'true',
  }
  await db.documents.add(doc)
  return NextResponse.json({ ok: true, id: docId }, { status: 201 })
}
