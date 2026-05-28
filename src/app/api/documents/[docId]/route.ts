import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStaffSession, getClientSession } from '@/lib/server-session'
import { canAccessClient } from '@/lib/perms'
import { readFileBuffer, fileExists } from '@/lib/storage'

export const runtime = 'nodejs'

// Download a document. Staff with access to the client, OR the client owner
// when the document is marked visible to the client.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params
  const doc = await db.documents.get(docId)
  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
  const client = await db.clients.get(doc.clientId)
  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  let allowed = false
  const staff = await getStaffSession()
  if (staff && canAccessClient(staff, client)) {
    allowed = true
  } else {
    const clientSession = await getClientSession()
    if (clientSession && clientSession.sub === doc.clientId && doc.visibleToClient) {
      allowed = true
    }
  }
  if (!allowed) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  if (!fileExists(doc.clientId, doc.storedName)) {
    return NextResponse.json({ error: 'Arquivo não encontrado no servidor' }, { status: 404 })
  }
  const buffer = readFileBuffer(doc.clientId, doc.storedName)
  const blob = new Blob([new Uint8Array(buffer)], {
    type: doc.mime || 'application/octet-stream',
  })
  return new NextResponse(blob, {
    headers: {
      'Content-Type': doc.mime || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(doc.originalName)}"`,
    },
  })
}
