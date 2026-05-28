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
  { id: 'staff_marina', name: 'Dra. Marina Alves', email: 'marina@govisa.local', role: 'case_manager' },
  { id: 'staff_rafael', name: 'Dr. Rafael Lima', email: 'rafael@govisa.local', role: 'case_manager' },
  { id: 'staff_coletor', name: 'Beatriz Nunes (Coletora)', email: 'coletor@govisa.local', role: 'assistente_coletor' },
  { id: 'staff_revisor', name: 'Paulo Andrade (Revisor)', email: 'revisor@govisa.local', role: 'revisor_tecnico' },
  { id: 'staff_juridico', name: 'Camila Reis (Jurídico)', email: 'juridico@govisa.local', role: 'assistente_juridico' },
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
  current: number
  status: ClientStatus
  eligibility: Eligibility
  urgent?: boolean
  complete?: boolean
}

const SPECS: Spec[] = [
  { fullName: 'Ana Beatriz Souza', passport: 'FN481223', dob: '1991-03-14', email: 'ana.souza@example.com', phone: '+55 11 98123-4567', whatsapp: '5511981234567', visa: 'T-Visa', manager: 'Dra. Marina Alves', current: 1, status: 'active', eligibility: 'eligible' },
  { fullName: 'Carlos Mendes Oliveira', passport: 'GH772900', dob: '1985-11-02', email: 'carlos.mendes@example.com', phone: '+55 21 99622-1180', whatsapp: '5521996221180', visa: 'U-Visa', manager: 'Dr. Rafael Lima', current: 3, status: 'active', eligibility: 'eligible' },
  { fullName: 'Mariana Costa Lima', passport: 'FP315544', dob: '1993-07-22', email: 'mariana.lima@example.com', phone: '+55 31 98711-2031', whatsapp: '5531987112031', visa: 'VAWA', manager: 'Dra. Marina Alves', current: 5, status: 'active', eligibility: 'eligible', urgent: true },
  { fullName: 'João Pedro Almeida', passport: 'GA908112', dob: '1979-01-30', email: 'joao.almeida@example.com', phone: '+55 11 99014-7782', whatsapp: '5511990147782', visa: 'U-Visa', manager: 'Dr. Rafael Lima', current: 6, status: 'active', eligibility: 'eligible' },
  { fullName: 'Fernanda Ribeiro', passport: 'FN660241', dob: '1996-05-09', email: 'fernanda.ribeiro@example.com', phone: '+55 41 98330-5512', whatsapp: '5541983305512', visa: 'T-Visa', manager: 'Dra. Marina Alves', current: 9, status: 'active', eligibility: 'eligible' },
  { fullName: 'Lucas Martins', passport: 'GB124870', dob: '1988-09-18', email: 'lucas.martins@example.com', phone: '+55 51 99880-2244', whatsapp: '5551998802244', visa: 'VAWA', manager: 'Dr. Rafael Lima', current: 2, status: 'paused', eligibility: 'pending' },
  { fullName: 'Patrícia Gomes', passport: 'FP771039', dob: '1982-12-05', email: 'patricia.gomes@example.com', phone: '+55 11 97444-9001', whatsapp: '5511974449001', visa: 'U-Visa', manager: 'Dra. Marina Alves', current: 10, status: 'active', eligibility: 'eligible' },
  { fullName: 'Rafael Teixeira', passport: 'GH205518', dob: '1994-04-27', email: 'rafael.teixeira@example.com', phone: '+55 19 98122-7766', whatsapp: '5519981227766', visa: 'T-Visa', manager: 'Dr. Rafael Lima', current: 0, status: 'active', eligibility: 'pending', urgent: true },
  { fullName: 'Juliana Carvalho', passport: 'FN339907', dob: '1990-08-13', email: 'juliana.carvalho@example.com', phone: '+55 71 99655-3300', whatsapp: '5571996553300', visa: 'VAWA', manager: 'Dra. Marina Alves', current: 4, status: 'active', eligibility: 'eligible' },
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
