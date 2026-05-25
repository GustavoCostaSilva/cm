import { SignJWT, jwtVerify } from 'jose'

// Edge-safe session module (jose only — used by middleware + APIs).
// Two independent audiences: staff (case management) and client (portal).

export type StaffRole = 'admin' | 'editor'

export interface StaffSession {
  sub: string
  email: string
  name: string
  role: StaffRole
}

export interface ClientSession {
  sub: string
  passport: string
  name: string
}

export const STAFF_COOKIE = 'gv_staff'
export const CLIENT_COOKIE = 'gv_client'

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || 'dev-insecure-secret-change-me-please-32chars',
  )
}

export async function signStaff(s: StaffSession): Promise<string> {
  return new SignJWT({ email: s.email, name: s.name, role: s.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.sub)
    .setAudience('staff')
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyStaff(token: string): Promise<StaffSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: 'staff' })
    if (!payload.sub) return null
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: (payload.role as StaffRole) ?? 'editor',
    }
  } catch {
    return null
  }
}

export async function signClient(s: ClientSession): Promise<string> {
  return new SignJWT({ passport: s.passport, name: s.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(s.sub)
    .setAudience('client')
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret())
}

export async function verifyClient(token: string): Promise<ClientSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: 'client' })
    if (!payload.sub) return null
    return {
      sub: String(payload.sub),
      passport: String(payload.passport ?? ''),
      name: String(payload.name ?? ''),
    }
  } catch {
    return null
  }
}
