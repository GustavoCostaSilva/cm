import { NextRequest, NextResponse } from 'next/server'
import {
  verifyStaff,
  verifyClient,
  STAFF_COOKIE,
  CLIENT_COOKIE,
} from '@/lib/session'

// Route map:
//  Public      → '/', '/gestao' (the two logins), '/api/auth/*'
//  Staff-only  → '/gestao/*', '/api/staff/*'
//  Client-only → '/meu-caso', '/api/client/*'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/auth/')) return NextResponse.next()

  const isApi = pathname.startsWith('/api/')

  // ── Staff area ──
  if (pathname.startsWith('/gestao/') || pathname.startsWith('/api/staff')) {
    const token = req.cookies.get(STAFF_COOKIE)?.value
    const session = token ? await verifyStaff(token) : null
    if (!session) {
      if (isApi) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      const url = req.nextUrl.clone()
      url.pathname = '/gestao'
      url.search = `?next=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Client area ──
  if (pathname === '/meu-caso' || pathname.startsWith('/api/client')) {
    const token = req.cookies.get(CLIENT_COOKIE)?.value
    const session = token ? await verifyClient(token) : null
    if (!session) {
      if (isApi) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.search = `?next=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
