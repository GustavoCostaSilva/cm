import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'

// Node < 22 has no global WebSocket; supabase-js constructs a realtime client
// that needs one at import time. We only use the REST API, but polyfill anyway.
const g = globalThis as { WebSocket?: unknown }
if (typeof g.WebSocket === 'undefined') g.WebSocket = ws

// Server-only admin client (service_role key — bypasses RLS). Lazy so the app
// can build/boot before credentials exist.
let _client: SupabaseClient | null = null

export function sb(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Supabase não configurado — defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local',
    )
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _client
}
