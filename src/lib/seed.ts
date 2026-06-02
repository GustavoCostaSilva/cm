import { hashPassword } from './auth'
import { STAGE_KEYS, STAGE_LABELS, freshStages } from '@/types'
import type {
  Client,
  CaseEvent,
  Deadline,
  StaffUser,
  StaffRole,
  OfficeConfig,
  StageProgress,
  ClientStatus,
  VisaType,
  Eligibility,
} from '@/types'

const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
const daysFromNow = (n: number) => daysAgo(-n)
const ymd = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// Typical days per stage (for realistic seed timing) — 11 stages.
const STAGE_DURATIONS = [1, 6, 1, 3, 3, 6, 3, 1, 1, 1, 20]

function buildStages(current: number, complete: boolean): StageProgress[] {
  const stages = freshStages()
  const n = STAGE_KEYS.length
  const doneCount = complete ? n : current
  let doneDays = 0
  for (let i = 0; i < doneCount; i++) doneDays += STAGE_DURATIONS[i]
  const activeElapsed = complete ? 0 : 4
  let cursor = daysAgo(doneDays + activeElapsed)
  for (let i = 0; i < n; i++) {
    if (i < doneCount) {
      stages[i].status = 'done'
      stages[i].startedAt = iso(cursor)
      cursor = addDays(cursor, STAGE_DURATIONS[i])
      stages[i].completedAt = iso(cursor)
    } else if (i === current && !complete) {
      stages[i].status = 'active'
      stages[i].startedAt = iso(cursor)
      stages[i].completedAt = null
    } else {
      stages[i].status = 'pending'
    }
  }
  return stages
}

// ── Staff: the 5 operational roles (manual §2.1) ──
const SEED_PASSWORD = 'govisa2026'
interface StaffSeed {
  id: string
  name: string
  email: string
  role: StaffRole
}
const STAFF_SEED: StaffSeed[] = [
  { id: 'staff_coord', name: 'Coordenação de Casos', email: 'admin@govisa.local', role: 'coordenador' },
  { id: 'staff_jeffrey', name: 'Mr. Jeffrey Weingrad', email: 'jeffrey@govisa.local', role: 'advogado' },
  { id: 'staff_diana', name: 'Mrs. Diana Carter', email: 'diana@govisa.local', role: 'advogado' },
  { id: 'staff_marina', name: 'Marina Alves', email: 'marina@govisa.local', role: 'case_manager' },
  { id: 'staff_rafael', name: 'Rafael Lima', email: 'rafael@govisa.local', role: 'case_manager' },
]
const idByName: Record<string, string> = Object.fromEntries(STAFF_SEED.map((m) => [m.name, m.id]))

interface Spec {
  fullName: string
  passport: string
  dob: string
  email: string
  phone: string
  whatsapp: string
  visa: VisaType
  manager: string
  attorney: string
  current: number
  status: ClientStatus
  eligibility: Eligibility
  urgent?: boolean
  complete?: boolean
}

const JEFFREY = 'Mr. Jeffrey Weingrad'
const SPECS: Spec[] = [
  { fullName: 'José', passport: 'FN481223', dob: '1991-03-14', email: 'ana.souza@example.com', phone: '+55 11 98123-4567', whatsapp: '5511981234567', visa: 'T-Visa', manager: 'Marina Alves', attorney: JEFFREY, current: 1, status: 'active', eligibility: 'eligible' },
]

export const DEFAULT_OFFICE: OfficeConfig = {
  officeName: 'Go Visa Law Firm',
  attorney: 'Mr. Jeffrey Weingrad',
  phone: '+1 (305) 555-0142',
  whatsapp: '13055550142',
  email: 'contato@govisalaw.com',
  addressLine: 'Miami, Florida — EUA',
  disclaimerText:
    'Você está sendo acompanhado e protegido pela equipe jurídica da Go Visa Law Firm. Este portal é um canal seguro e transparente sobre o andamento do seu caso. Em caso de qualquer dúvida, fale diretamente com o nosso escritório pelos contatos abaixo.',
}

function buildEvents(client: Client, authorName: string): CaseEvent[] {
  const out: CaseEvent[] = []
  let n = 0
  const push = (e: Omit<CaseEvent, 'id' | 'clientId'>) =>
    out.push({ id: `${client.id}_ev${n++}`, clientId: client.id, ...e })

  push({
    stageKey: null,
    type: 'created',
    text: 'Bem-vindo(a)! Seu caso foi aberto e estamos cuidando de tudo com atenção.',
    author: authorName,
    createdAt: client.createdAt,
    visibleToClient: true,
    notified: false,
  })

  // Internal stage events (not shown to the client; client sees milestones).
  for (const stage of client.stages) {
    if (stage.status === 'done') {
      push({ stageKey: stage.key, type: 'stage_completed', text: `Etapa "${STAGE_LABELS[stage.key]}" concluída.`, author: authorName, createdAt: stage.completedAt!, visibleToClient: false, notified: false })
    } else if (stage.status === 'active') {
      push({ stageKey: stage.key, type: 'stage_started', text: `Etapa "${STAGE_LABELS[stage.key]}" em andamento.`, author: authorName, createdAt: stage.startedAt!, visibleToClient: false, notified: false })
    }
  }
  return out
}

function buildDeadlines(client: Client, current: number): Deadline[] {
  if (client.status === 'closed') return []
  const out: Deadline[] = []
  let n = 0
  const id = () => `${client.id}_dl${n++}`
  const stageKey = STAGE_KEYS[current]
  out.push({ id: id(), clientId: client.id, title: `Prazo da etapa: ${STAGE_LABELS[stageKey]}`, dueDate: ymd(daysFromNow(client.urgent ? 2 : 6)), status: 'pending', stageKey })
  if (current >= 1 && current <= 8) {
    out.push({ id: id(), clientId: client.id, title: 'Revisão de andamento do caso', dueDate: ymd(daysFromNow(14)), status: 'pending', stageKey: null })
  }
  if (client.urgent) {
    out.push({ id: id(), clientId: client.id, title: 'Caso URGENTE — acompanhamento diário', dueDate: ymd(daysAgo(1)), status: 'pending', stageKey: null })
  }
  return out
}

export interface SeedData {
  clients: Client[]
  events: CaseEvent[]
  deadlines: Deadline[]
  staff: StaffUser[]
  office: OfficeConfig
}

export function buildSeed(): SeedData {
  const clients: Client[] = []
  const events: CaseEvent[] = []
  const deadlines: Deadline[] = []

  SPECS.forEach((spec, idx) => {
    const stages = buildStages(spec.current, spec.complete ?? false)
    const createdAt = stages[0].startedAt ?? iso(daysAgo(30))
    const client: Client = {
      id: `cli_${String(idx + 1).padStart(2, '0')}`,
      fullName: spec.fullName,
      passport: spec.passport,
      dateOfBirth: spec.dob,
      email: spec.email,
      phone: spec.phone,
      whatsapp: spec.whatsapp,
      caseType: spec.visa,
      urgent: spec.urgent ?? false,
      eligibility: spec.eligibility,
      assignedTo: idByName[spec.manager] ?? null,
      attorneyId: idByName[spec.attorney] ?? null,
      status: spec.status,
      createdAt,
      stages,
      checklistDone: [],
    }
    clients.push(client)
    events.push(...buildEvents(client, spec.manager))
    deadlines.push(...buildDeadlines(client, spec.current))
  })

  const staff: StaffUser[] = STAFF_SEED.map((m) => ({
    id: m.id,
    email: m.email,
    passwordHash: hashPassword(SEED_PASSWORD),
    name: m.name,
    role: m.role,
    active: true,
    createdAt: iso(daysAgo(200)),
  }))

  return { clients, events, deadlines, staff, office: DEFAULT_OFFICE }
}
