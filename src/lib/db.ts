import fs from 'node:fs'
import path from 'node:path'
import type { Client, CaseEvent, Deadline, StaffUser, OfficeConfig } from '@/types'
import { buildSeed, DEFAULT_OFFICE } from './seed'

// In-memory store, lazily loaded. Source of truth is a module-level cache so it
// works on read-only/serverless filesystems (Netlify, Vercel) where the data
// can't be written to disk. On a writable FS (local dev) it also persists to
// `data/*.json` on a best-effort basis. Demo-grade: data resets on cold start.

const DATA_DIR = path.join(process.cwd(), 'data')
const f = (name: string) => path.join(DATA_DIR, name)

interface Store {
  clients: Client[]
  events: CaseEvent[]
  deadlines: Deadline[]
  staff: StaffUser[]
  office: OfficeConfig
}

let store: Store | null = null

function readFileSafe<T>(name: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(f(name), 'utf-8')) as T
  } catch {
    return null
  }
}

function persist(name: string, data: unknown): void {
  // Best-effort: silently ignored on read-only filesystems (serverless).
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(f(name), JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    /* read-only FS — in-memory only */
  }
}

function load(): Store {
  if (store) return store
  const clients = readFileSafe<Client[]>('clients.json')
  if (clients) {
    store = {
      clients,
      events: readFileSafe<CaseEvent[]>('events.json') ?? [],
      deadlines: readFileSafe<Deadline[]>('deadlines.json') ?? [],
      staff: readFileSafe<StaffUser[]>('staff.json') ?? [],
      office: readFileSafe<OfficeConfig>('office.json') ?? DEFAULT_OFFICE,
    }
  } else {
    store = buildSeed()
    persist('clients.json', store.clients)
    persist('events.json', store.events)
    persist('deadlines.json', store.deadlines)
    persist('staff.json', store.staff)
    persist('office.json', store.office)
  }
  return store
}

export const db = {
  clients: {
    all(): Client[] {
      return load().clients
    },
    get(id: string): Client | undefined {
      return load().clients.find((c) => c.id === id)
    },
    getByPassport(passport: string): Client | undefined {
      const p = passport.trim().toLowerCase()
      return load().clients.find((c) => c.passport.toLowerCase() === p)
    },
    create(c: Client): void {
      load().clients.push(c)
      persist('clients.json', store!.clients)
    },
    update(id: string, patch: Partial<Client>): void {
      const s = load()
      const i = s.clients.findIndex((c) => c.id === id)
      if (i < 0) return
      s.clients[i] = { ...s.clients[i], ...patch }
      persist('clients.json', s.clients)
    },
  },

  events: {
    all(): CaseEvent[] {
      return load().events
    },
    byClient(id: string): CaseEvent[] {
      return load()
        .events.filter((e) => e.clientId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    add(e: CaseEvent): void {
      load().events.push(e)
      persist('events.json', store!.events)
    },
  },

  deadlines: {
    all(): Deadline[] {
      return load().deadlines
    },
    byClient(id: string): Deadline[] {
      return load()
        .deadlines.filter((d) => d.clientId === id)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    },
    add(d: Deadline): void {
      load().deadlines.push(d)
      persist('deadlines.json', store!.deadlines)
    },
    update(id: string, patch: Partial<Deadline>): void {
      const s = load()
      const i = s.deadlines.findIndex((d) => d.id === id)
      if (i < 0) return
      s.deadlines[i] = { ...s.deadlines[i], ...patch }
      persist('deadlines.json', s.deadlines)
    },
    remove(id: string): void {
      const s = load()
      s.deadlines = s.deadlines.filter((d) => d.id !== id)
      persist('deadlines.json', s.deadlines)
    },
  },

  staff: {
    all(): StaffUser[] {
      return load().staff
    },
    getByEmail(email: string): StaffUser | undefined {
      const e = email.trim().toLowerCase()
      return load().staff.find((u) => u.email.toLowerCase() === e)
    },
    get(id: string): StaffUser | undefined {
      return load().staff.find((u) => u.id === id)
    },
  },

  office: {
    get(): OfficeConfig {
      return load().office
    },
    save(cfg: OfficeConfig): void {
      const s = load()
      s.office = cfg
      persist('office.json', s.office)
    },
  },
}
