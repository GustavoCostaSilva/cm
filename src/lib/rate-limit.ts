// In-memory rate limiter for the low-entropy client login (passport + DOB).
// Good enough for a single-instance local deployment.

interface Bucket {
  count: number
  firstAt: number
  blockedUntil: number
}

const WINDOW_MS = 15 * 60 * 1000 // 15 min
const MAX_ATTEMPTS = 8
const BLOCK_MS = 15 * 60 * 1000 // lockout after exceeding

const buckets = new Map<string, Bucket>()

export interface RateResult {
  blocked: boolean
  retryAfterSec: number
}

export function checkRateLimit(key: string): RateResult {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b) return { blocked: false, retryAfterSec: 0 }
  if (b.blockedUntil > now) {
    return { blocked: true, retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000) }
  }
  if (now - b.firstAt > WINDOW_MS) {
    buckets.delete(key)
    return { blocked: false, retryAfterSec: 0 }
  }
  return { blocked: false, retryAfterSec: 0 }
}

export function registerFailure(key: string): void {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now - b.firstAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAt: now, blockedUntil: 0 })
    return
  }
  b.count += 1
  if (b.count >= MAX_ATTEMPTS) {
    b.blockedUntil = now + BLOCK_MS
  }
}

export function resetRateLimit(key: string): void {
  buckets.delete(key)
}
