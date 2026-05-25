import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

// Password hashing for staff accounts (server/node only — node:crypto scrypt).
export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pw, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const calc = scryptSync(pw, salt, 64)
  const orig = Buffer.from(hash, 'hex')
  return calc.length === orig.length && timingSafeEqual(calc, orig)
}

// Normalize a date-of-birth string to the canonical YYYY-MM-DD used as the
// client's password. Accepts YYYY-MM-DD or DD/MM/YYYY.
export function normalizeDob(input: string): string {
  const s = input.trim()
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)
  if (br) return `${br[3]}-${br[2]}-${br[1]}`
  return s
}
