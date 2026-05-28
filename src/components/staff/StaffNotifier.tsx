'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, BellRing, BellOff } from 'lucide-react'

interface RecentMessage {
  id: string
  clientId: string
  clientName: string
  authorName: string
  text: string
  createdAt: string
}

const POLL_MS = 15000
const BASE_TITLE_KEY = '__gv_base_title'

type PermState = 'unsupported' | 'default' | 'granted' | 'denied'

function readPermission(): PermState {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window) || !window.isSecureContext) return 'unsupported'
  return Notification.permission as PermState
}

// Permission is browser-owned external state — read it via useSyncExternalStore
// so SSR stays stable and we can re-read after requestPermission() resolves.
const permListeners = new Set<() => void>()
function subscribePerm(cb: () => void): () => void {
  permListeners.add(cb)
  return () => {
    permListeners.delete(cb)
  }
}
function emitPerm() {
  permListeners.forEach((l) => l())
}
function permServerSnapshot(): PermState {
  return 'default'
}

// Short, soft two-tone beep via WebAudio — no asset needed. Best-effort.
function beep(ctx: AudioContext | null) {
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.setValueAtTime(1175, now + 0.16)
    osc.connect(gain)
    osc.start(now)
    osc.stop(now + 0.34)
  } catch {
    /* ignore */
  }
}

export function StaffNotifier() {
  const router = useRouter()
  const perm = useSyncExternalStore(subscribePerm, readPermission, permServerSnapshot)
  const [unread, setUnread] = useState(0)

  const seenAtRef = useRef<string | null>(null)
  const storageKeyRef = useRef<string | null>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const startedRef = useRef(false)

  // Reflect the unread count in the tab title so a blurred tab still signals.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const w = window as unknown as Record<string, string>
    if (!w[BASE_TITLE_KEY]) w[BASE_TITLE_KEY] = document.title
    const base = w[BASE_TITLE_KEY]
    document.title = unread > 0 ? `(${unread}) ${base}` : base
  }, [unread])

  useEffect(() => {
    const clear = () => setUnread(0)
    window.addEventListener('focus', clear)
    return () => window.removeEventListener('focus', clear)
  }, [])

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) audioRef.current = new Ctor()
    } catch {
      /* ignore */
    }
    return audioRef.current
  }, [])

  const announce = useCallback(
    (m: RecentMessage, ctx: AudioContext | null) => {
      const title = `Nova mensagem — ${m.clientName}`
      const body = m.text.length > 120 ? m.text.slice(0, 117) + '…' : m.text
      const focused = typeof document !== 'undefined' && document.hasFocus()

      // Native OS notification (only when the tab is in the background and we
      // have permission in a secure context).
      if (!focused && readPermission() === 'granted') {
        try {
          const n = new Notification(title, { body, tag: `gv-msg-${m.clientId}` })
          n.onclick = () => {
            window.focus()
            router.push(`/gestao/clientes/${m.clientId}`)
            n.close()
          }
        } catch {
          /* fall through to in-app */
        }
      }

      // In-app toast — always shown, works on plain HTTP too.
      toast.message(title, {
        description: body,
        action: {
          label: 'Abrir',
          onClick: () => router.push(`/gestao/clientes/${m.clientId}`),
        },
      })
      beep(ctx)
      if (!focused) setUnread((u) => u + 1)
    },
    [router],
  )

  const poll = useCallback(async () => {
    let res: Response
    try {
      res = await fetch('/api/staff/messages/recent', { cache: 'no-store' })
    } catch {
      return
    }
    if (!res.ok) return
    const data = (await res.json().catch(() => null)) as
      | { staffId: string; messages: RecentMessage[] }
      | null
    if (!data) return

    if (!storageKeyRef.current) {
      storageKeyRef.current = `gv_clientmsg_seen:${data.staffId}`
      seenAtRef.current = localStorage.getItem(storageKeyRef.current)
    }

    const msgs = data.messages
    const newestAt = msgs[0]?.createdAt ?? null

    // First run with no stored cursor: establish a baseline so we don't replay
    // the whole backlog — only messages that arrive AFTER now will alert.
    if (seenAtRef.current == null) {
      seenAtRef.current = newestAt ?? new Date().toISOString()
      if (storageKeyRef.current) localStorage.setItem(storageKeyRef.current, seenAtRef.current)
      return
    }

    const cursor = seenAtRef.current
    const fresh = msgs
      .filter((m) => m.createdAt > cursor)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    if (fresh.length === 0) return

    const ctx = audioRef.current
    if (fresh.length <= 3) {
      for (const m of fresh) announce(m, ctx)
    } else {
      // Collapse a burst into a single alert.
      announce(
        {
          ...fresh[fresh.length - 1],
          text: `${fresh.length} novas mensagens de clientes`,
        },
        ctx,
      )
    }

    seenAtRef.current = fresh[fresh.length - 1].createdAt
    if (storageKeyRef.current) localStorage.setItem(storageKeyRef.current, seenAtRef.current)
  }, [announce])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    poll()
    const timer = setInterval(poll, POLL_MS)
    const onVisible = () => {
      if (!document.hidden) poll()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [poll])

  async function enable() {
    ensureAudio()
    beep(audioRef.current) // confirm sound + unlock audio on this gesture
    if (readPermission() === 'unsupported') {
      toast.info('Alertas no painel ativados', {
        description:
          'As notificações do sistema operacional exigem HTTPS. Por enquanto, os avisos aparecem aqui no painel (com som).',
      })
      return
    }
    try {
      const result = await Notification.requestPermission()
      emitPerm()
      if (result === 'granted') toast.success('Notificações ativadas.')
      else if (result === 'denied')
        toast.warning('Notificações bloqueadas pelo navegador. Os avisos continuam no painel.')
    } catch {
      emitPerm()
    }
  }

  const Icon = perm === 'granted' ? BellRing : perm === 'denied' || perm === 'unsupported' ? BellOff : Bell
  const title =
    perm === 'granted'
      ? 'Notificações de mensagens ativas'
      : perm === 'denied'
        ? 'Notificações bloqueadas no navegador — avisos aparecem no painel'
        : perm === 'unsupported'
          ? 'Notificações do navegador exigem HTTPS — avisos aparecem no painel'
          : 'Ativar notificações de novas mensagens'

  return (
    <button
      type="button"
      onClick={enable}
      title={title}
      aria-label={title}
      className="relative inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      <Icon className="size-[18px]" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
