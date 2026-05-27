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
} from '@/types'

// ── helpers ──
const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
const daysFromNow = (n: number) => daysAgo(-n)
const ymd = (d: Date) => d.toISOString().slice(0, 10)

// ── staff (1 admin/gerência + case managers) ──
const SEED_PASSWORD = 'govisa2026'
interface StaffSeed {
  id: string
  name: string
  email: string
  role: StaffRole
}
const STAFF_SEED: StaffSeed[] = [
  { id: 'staff_admin', name: 'Gerência GoVisa', email: 'admin@govisa.local', role: 'admin' },
  { id: 'staff_marina', name: 'Dra. Marina Alves', email: 'marina@govisa.local', role: 'case_manager' },
  { id: 'staff_rafael', name: 'Dr. Rafael Lima', email: 'rafael@govisa.local', role: 'case_manager' },
  { id: 'staff_jeffrey', name: 'Mr. Jeffrey Weingrad', email: 'jeffrey@govisa.local', role: 'case_manager' },
]
const idByName: Record<string, string> = Object.fromEntries(
  STAFF_SEED.map((m) => [m.name, m.id]),
)

const STAGE_DURATIONS = [7, 21, 30, 25, 12]
const START_OFFSET = [3, 25, 65, 110, 150]

function buildStages(current: number, complete: boolean): StageProgress[] {
  const stages = freshStages()
  const startedDaysAgo = complete ? 185 : START_OFFSET[current]
  let cursor = daysAgo(startedDaysAgo)
  for (let i = 0; i < STAGE_KEYS.length; i++) {
    const isDone = complete ? true : i < current
    if (isDone) {
      stages[i].status = 'done'
      stages[i].startedAt = iso(cursor)
      const end = new Date(cursor)
      end.setDate(end.getDate() + STAGE_DURATIONS[i])
      stages[i].completedAt = iso(end)
      cursor = end
    } else if (i === current) {
      stages[i].status = 'active'
      stages[i].startedAt = iso(cursor)
      stages[i].completedAt = null
    } else {
      stages[i].status = 'pending'
    }
  }
  return stages
}

const STAGE_DONE_NOTE: Record<string, string> = {
  consulta: 'Consulta inicial realizada e estratégia do caso definida com o cliente.',
  documentacao: 'Toda a documentação foi coletada, revisada e organizada.',
  protocolo: 'Processo protocolado junto ao órgão competente. Aguardando análise.',
  audiencia: 'Audiência realizada. Defesa apresentada e caso aguardando decisão.',
  decisao: 'Decisão proferida. Cliente orientado sobre os próximos passos.',
}
const STAGE_ACTIVE_NOTE: Record<string, string> = {
  consulta: 'Em consulta inicial — avaliando os detalhes do seu caso.',
  documentacao: 'Reunindo e revisando seus documentos.',
  protocolo: 'Preparando o protocolo do seu processo.',
  audiencia: 'Preparando sua audiência e a estratégia de defesa.',
  decisao: 'Acompanhando a decisão final do seu caso.',
}

interface Spec {
  fullName: string
  passport: string
  dob: string
  email: string
  phone: string
  whatsapp: string
  caseType: string
  manager: string // case manager name
  current: number
  status: ClientStatus
  complete?: boolean
}

const SPECS: Spec[] = [
  { fullName: 'Ana Beatriz Souza', passport: 'FN481223', dob: '1991-03-14', email: 'ana.souza@example.com', phone: '+55 11 98123-4567', whatsapp: '5511981234567', caseType: 'Asylum', manager: 'Dra. Marina Alves', current: 0, status: 'active' },
  { fullName: 'Carlos Mendes Oliveira', passport: 'GH772900', dob: '1985-11-02', email: 'carlos.mendes@example.com', phone: '+55 21 99622-1180', whatsapp: '5521996221180', caseType: 'Court — Removal Defense', manager: 'Dr. Rafael Lima', current: 1, status: 'active' },
  { fullName: 'Mariana Costa Lima', passport: 'FP315544', dob: '1993-07-22', email: 'mariana.lima@example.com', phone: '+55 31 98711-2031', whatsapp: '5531987112031', caseType: 'Adjustment of Status', manager: 'Dra. Marina Alves', current: 2, status: 'active' },
  { fullName: 'João Pedro Almeida', passport: 'GA908112', dob: '1979-01-30', email: 'joao.almeida@example.com', phone: '+55 11 99014-7782', whatsapp: '5511990147782', caseType: 'Court — Removal Defense', manager: 'Mr. Jeffrey Weingrad', current: 3, status: 'active' },
  { fullName: 'Fernanda Ribeiro', passport: 'FN660241', dob: '1996-05-09', email: 'fernanda.ribeiro@example.com', phone: '+55 41 98330-5512', whatsapp: '5541983305512', caseType: 'Work Permit (EAD)', manager: 'Dr. Rafael Lima', current: 4, status: 'active' },
  { fullName: 'Lucas Martins', passport: 'GB124870', dob: '1988-09-18', email: 'lucas.martins@example.com', phone: '+55 51 99880-2244', whatsapp: '5551998802244', caseType: 'Family Petition', manager: 'Dra. Marina Alves', current: 2, status: 'paused' },
  { fullName: 'Patrícia Gomes', passport: 'FP771039', dob: '1982-12-05', email: 'patricia.gomes@example.com', phone: '+55 11 97444-9001', whatsapp: '5511974449001', caseType: 'Adjustment of Status', manager: 'Mr. Jeffrey Weingrad', current: 4, status: 'closed', complete: true },
  { fullName: 'Rafael Teixeira', passport: 'GH205518', dob: '1994-04-27', email: 'rafael.teixeira@example.com', phone: '+55 19 98122-7766', whatsapp: '5519981227766', caseType: 'Asylum', manager: 'Dr. Rafael Lima', current: 1, status: 'active' },
  { fullName: 'Juliana Carvalho', passport: 'FN339907', dob: '1990-08-13', email: 'juliana.carvalho@example.com', phone: '+55 71 99655-3300', whatsapp: '5571996553300', caseType: 'Court — Removal Defense', manager: 'Dra. Marina Alves', current: 3, status: 'active' },
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
    text: 'Caso aberto e cadastrado. Bem-vindo(a) ao portal de acompanhamento.',
    author: authorName,
    createdAt: client.createdAt,
    visibleToClient: true,
    notified: false,
  })

  for (const stage of client.stages) {
    if (stage.status === 'done') {
      push({ stageKey: stage.key, type: 'stage_started', text: `Etapa "${STAGE_LABELS[stage.key]}" iniciada.`, author: authorName, createdAt: stage.startedAt!, visibleToClient: true, notified: true })
      push({ stageKey: stage.key, type: 'stage_completed', text: STAGE_DONE_NOTE[stage.key], author: authorName, createdAt: stage.completedAt!, visibleToClient: true, notified: true })
    } else if (stage.status === 'active') {
      push({ stageKey: stage.key, type: 'stage_started', text: STAGE_ACTIVE_NOTE[stage.key], author: authorName, createdAt: stage.startedAt!, visibleToClient: true, notified: true })
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
  const titleByStage: Record<string, string> = {
    consulta: 'Retorno da consulta inicial',
    documentacao: 'Envio dos documentos pendentes',
    protocolo: 'Protocolo do processo',
    audiencia: 'Audiência no tribunal',
    decisao: 'Acompanhamento da decisão',
  }
  out.push({ id: id(), clientId: client.id, title: titleByStage[stageKey], dueDate: ymd(daysFromNow(6 + current * 3)), status: 'pending', stageKey })
  out.push({ id: id(), clientId: client.id, title: 'Revisão de andamento do caso', dueDate: ymd(daysFromNow(34 + current * 2)), status: 'pending', stageKey: null })
  if (client.status === 'active' && (current === 1 || current === 3)) {
    out.push({ id: id(), clientId: client.id, title: 'Confirmar dados de contato', dueDate: ymd(daysAgo(3)), status: 'pending', stageKey: null })
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
    const createdAt = stages[0].startedAt ?? iso(daysAgo(START_OFFSET[spec.current]))
    const client: Client = {
      id: `cli_${String(idx + 1).padStart(2, '0')}`,
      fullName: spec.fullName,
      passport: spec.passport,
      dateOfBirth: spec.dob,
      email: spec.email,
      phone: spec.phone,
      whatsapp: spec.whatsapp,
      caseType: spec.caseType,
      assignedTo: idByName[spec.manager] ?? null,
      status: spec.status,
      createdAt,
      stages,
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
