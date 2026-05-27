import type { Client, CaseEvent, Deadline, StaffUser, OfficeConfig } from '@/types'
import { sb } from './supabase'
import { buildSeed } from './seed'

// Supabase-backed data layer (portal_* tables in the shared self-hosted
// Supabase). Async API. Columns are snake_case in the DB; we map to/from the
// camelCase domain types here so the rest of the app is unchanged.

type Row = Record<string, unknown>
const s = (v: unknown) => (v == null ? null : String(v))

// ── mappers ──
function toClient(r: Row): Client {
  return {
    id: String(r.id),
    fullName: String(r.full_name),
    passport: String(r.passport),
    dateOfBirth: String(r.date_of_birth),
    email: s(r.email),
    phone: s(r.phone),
    whatsapp: s(r.whatsapp),
    caseType: s(r.case_type),
    assignedTo: s(r.assigned_to),
    status: r.status as Client['status'],
    createdAt: String(r.created_at),
    stages: (r.stages as Client['stages']) ?? [],
  }
}
function fromClient(c: Partial<Client>): Row {
  const r: Row = {}
  if (c.id !== undefined) r.id = c.id
  if (c.fullName !== undefined) r.full_name = c.fullName
  if (c.passport !== undefined) r.passport = c.passport
  if (c.dateOfBirth !== undefined) r.date_of_birth = c.dateOfBirth
  if (c.email !== undefined) r.email = c.email
  if (c.phone !== undefined) r.phone = c.phone
  if (c.whatsapp !== undefined) r.whatsapp = c.whatsapp
  if (c.caseType !== undefined) r.case_type = c.caseType
  if (c.assignedTo !== undefined) r.assigned_to = c.assignedTo
  if (c.status !== undefined) r.status = c.status
  if (c.createdAt !== undefined) r.created_at = c.createdAt
  if (c.stages !== undefined) r.stages = c.stages
  return r
}
function toEvent(r: Row): CaseEvent {
  return {
    id: String(r.id),
    clientId: String(r.client_id),
    stageKey: (r.stage_key as CaseEvent['stageKey']) ?? null,
    type: r.type as CaseEvent['type'],
    text: String(r.text),
    author: String(r.author),
    createdAt: String(r.created_at),
    visibleToClient: Boolean(r.visible_to_client),
    notified: Boolean(r.notified),
  }
}
function fromEvent(e: CaseEvent): Row {
  return {
    id: e.id,
    client_id: e.clientId,
    stage_key: e.stageKey,
    type: e.type,
    text: e.text,
    author: e.author,
    created_at: e.createdAt,
    visible_to_client: e.visibleToClient,
    notified: e.notified,
  }
}
function toDeadline(r: Row): Deadline {
  return {
    id: String(r.id),
    clientId: String(r.client_id),
    title: String(r.title),
    dueDate: String(r.due_date),
    status: r.status as Deadline['status'],
    stageKey: (r.stage_key as Deadline['stageKey']) ?? null,
  }
}
function fromDeadline(d: Partial<Deadline>): Row {
  const r: Row = {}
  if (d.id !== undefined) r.id = d.id
  if (d.clientId !== undefined) r.client_id = d.clientId
  if (d.title !== undefined) r.title = d.title
  if (d.dueDate !== undefined) r.due_date = d.dueDate
  if (d.status !== undefined) r.status = d.status
  if (d.stageKey !== undefined) r.stage_key = d.stageKey
  return r
}
function toStaff(r: Row): StaffUser {
  return {
    id: String(r.id),
    email: String(r.email),
    passwordHash: String(r.password_hash),
    name: String(r.name),
    role: r.role as StaffUser['role'],
    active: Boolean(r.active),
    createdAt: String(r.created_at),
  }
}
function fromStaff(u: Partial<StaffUser>): Row {
  const r: Row = {}
  if (u.id !== undefined) r.id = u.id
  if (u.email !== undefined) r.email = u.email
  if (u.passwordHash !== undefined) r.password_hash = u.passwordHash
  if (u.name !== undefined) r.name = u.name
  if (u.role !== undefined) r.role = u.role
  if (u.active !== undefined) r.active = u.active
  if (u.createdAt !== undefined) r.created_at = u.createdAt
  return r
}
function toOffice(r: Row): OfficeConfig {
  return {
    officeName: String(r.office_name),
    attorney: String(r.attorney),
    phone: String(r.phone),
    whatsapp: String(r.whatsapp),
    email: String(r.email),
    addressLine: s(r.address_line),
    disclaimerText: String(r.disclaimer_text),
  }
}
function fromOffice(o: OfficeConfig): Row {
  return {
    office_name: o.officeName,
    attorney: o.attorney,
    phone: o.phone,
    whatsapp: o.whatsapp,
    email: o.email,
    address_line: o.addressLine,
    disclaimer_text: o.disclaimerText,
  }
}

// ── idempotent seed (runs once per process; the VPS runs a persistent server) ──
let seedChecked = false
async function ensureSeeded(): Promise<void> {
  if (seedChecked) return
  seedChecked = true
  const { count, error } = await sb()
    .from('portal_staff')
    .select('id', { count: 'exact', head: true })
  if (error || (count ?? 0) > 0) return
  const seed = buildSeed()
  await sb().from('portal_staff').insert(seed.staff.map(fromStaff))
  await sb().from('portal_clients').insert(seed.clients.map(fromClient))
  if (seed.events.length)
    await sb().from('portal_case_events').insert(seed.events.map(fromEvent))
  if (seed.deadlines.length)
    await sb().from('portal_deadlines').insert(seed.deadlines.map(fromDeadline))
  await sb().from('portal_office').upsert({ id: 1, ...fromOffice(seed.office) })
}

function rows<T>(data: unknown): T[] {
  return (data ?? []) as T[]
}

export const db = {
  clients: {
    async all(): Promise<Client[]> {
      await ensureSeeded()
      const { data } = await sb().from('portal_clients').select('*').order('full_name')
      return rows<Row>(data).map(toClient)
    },
    async get(id: string): Promise<Client | undefined> {
      await ensureSeeded()
      const { data } = await sb().from('portal_clients').select('*').eq('id', id).maybeSingle()
      return data ? toClient(data) : undefined
    },
    async getByPassport(passport: string): Promise<Client | undefined> {
      await ensureSeeded()
      const { data } = await sb()
        .from('portal_clients')
        .select('*')
        .ilike('passport', passport.trim())
        .limit(1)
      const r = rows<Row>(data)[0]
      return r ? toClient(r) : undefined
    },
    async create(c: Client): Promise<void> {
      await sb().from('portal_clients').insert(fromClient(c))
    },
    async update(id: string, patch: Partial<Client>): Promise<void> {
      await sb().from('portal_clients').update(fromClient(patch)).eq('id', id)
    },
  },

  events: {
    async all(): Promise<CaseEvent[]> {
      await ensureSeeded()
      const { data } = await sb()
        .from('portal_case_events')
        .select('*')
        .order('created_at', { ascending: false })
      return rows<Row>(data).map(toEvent)
    },
    async byClient(id: string): Promise<CaseEvent[]> {
      await ensureSeeded()
      const { data } = await sb()
        .from('portal_case_events')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false })
      return rows<Row>(data).map(toEvent)
    },
    async add(e: CaseEvent): Promise<void> {
      await sb().from('portal_case_events').insert(fromEvent(e))
    },
  },

  deadlines: {
    async all(): Promise<Deadline[]> {
      await ensureSeeded()
      const { data } = await sb().from('portal_deadlines').select('*').order('due_date')
      return rows<Row>(data).map(toDeadline)
    },
    async byClient(id: string): Promise<Deadline[]> {
      await ensureSeeded()
      const { data } = await sb()
        .from('portal_deadlines')
        .select('*')
        .eq('client_id', id)
        .order('due_date')
      return rows<Row>(data).map(toDeadline)
    },
    async add(d: Deadline): Promise<void> {
      await sb().from('portal_deadlines').insert(fromDeadline(d))
    },
    async update(id: string, patch: Partial<Deadline>): Promise<void> {
      await sb().from('portal_deadlines').update(fromDeadline(patch)).eq('id', id)
    },
    async remove(id: string): Promise<void> {
      await sb().from('portal_deadlines').delete().eq('id', id)
    },
  },

  staff: {
    async all(): Promise<StaffUser[]> {
      await ensureSeeded()
      const { data } = await sb().from('portal_staff').select('*').order('created_at')
      return rows<Row>(data).map(toStaff)
    },
    async getByEmail(email: string): Promise<StaffUser | undefined> {
      await ensureSeeded()
      const { data } = await sb()
        .from('portal_staff')
        .select('*')
        .ilike('email', email.trim())
        .limit(1)
      const r = rows<Row>(data)[0]
      return r ? toStaff(r) : undefined
    },
    async get(id: string): Promise<StaffUser | undefined> {
      await ensureSeeded()
      const { data } = await sb().from('portal_staff').select('*').eq('id', id).maybeSingle()
      return data ? toStaff(data) : undefined
    },
    async create(u: StaffUser): Promise<void> {
      await sb().from('portal_staff').insert(fromStaff(u))
    },
    async update(id: string, patch: Partial<StaffUser>): Promise<void> {
      await sb().from('portal_staff').update(fromStaff(patch)).eq('id', id)
    },
  },

  office: {
    async get(): Promise<OfficeConfig> {
      await ensureSeeded()
      const { data } = await sb().from('portal_office').select('*').eq('id', 1).maybeSingle()
      return data ? toOffice(data) : buildSeed().office
    },
    async save(cfg: OfficeConfig): Promise<void> {
      await sb()
        .from('portal_office')
        .upsert({ id: 1, ...fromOffice(cfg) })
    },
  },
}
