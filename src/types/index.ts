// ── Domain model for the GoVisa Portal (client + case-management) ──

export const STAGE_KEYS = [
  'consulta',
  'documentacao',
  'protocolo',
  'audiencia',
  'decisao',
] as const

export type StageKey = (typeof STAGE_KEYS)[number]

export const STAGE_LABELS: Record<StageKey, string> = {
  consulta: 'Consulta',
  documentacao: 'Documentação',
  protocolo: 'Protocolo',
  audiencia: 'Audiência',
  decisao: 'Decisão',
}

// Friendly, client-facing description of each stage.
export const STAGE_DESCRIPTIONS: Record<StageKey, string> = {
  consulta: 'Avaliação inicial do seu caso e definição da estratégia.',
  documentacao: 'Coleta e preparação de todos os documentos necessários.',
  protocolo: 'Submissão do seu processo aos órgãos competentes.',
  audiencia: 'Preparação e acompanhamento da sua audiência no tribunal.',
  decisao: 'Decisão final do caso e orientação dos próximos passos.',
}

export type StageStatus = 'pending' | 'active' | 'done'

export interface StageProgress {
  key: StageKey
  status: StageStatus
  startedAt: string | null
  completedAt: string | null
  note: string | null
}

export type CaseEventType =
  | 'created'
  | 'note'
  | 'stage_started'
  | 'stage_completed'
  | 'flag'
  | 'deadline'

export interface CaseEvent {
  id: string
  clientId: string
  stageKey: StageKey | null
  type: CaseEventType
  text: string
  author: string
  createdAt: string
  visibleToClient: boolean
  notified: boolean
}

export type DeadlineStatus = 'pending' | 'done'

export interface Deadline {
  id: string
  clientId: string
  title: string
  dueDate: string // YYYY-MM-DD
  status: DeadlineStatus
  stageKey: StageKey | null
}

export type ClientStatus = 'active' | 'paused' | 'closed'

export interface Client {
  id: string
  fullName: string
  passport: string
  dateOfBirth: string // YYYY-MM-DD — used as the portal password
  email: string | null
  phone: string | null
  whatsapp: string | null
  caseType: string | null
  assignedTo: string | null
  status: ClientStatus
  createdAt: string
  stages: StageProgress[]
}

export type StaffRole = 'admin' | 'editor'

export interface StaffUser {
  id: string
  email: string
  passwordHash: string
  name: string
  role: StaffRole
  active: boolean
  createdAt: string
}

export interface OfficeConfig {
  officeName: string
  attorney: string
  phone: string
  whatsapp: string // digits only, for wa.me links
  email: string
  addressLine: string | null
  disclaimerText: string
}

// Fresh ordered stage list for a brand-new client.
export function freshStages(): StageProgress[] {
  return STAGE_KEYS.map((key) => ({
    key,
    status: 'pending' as StageStatus,
    startedAt: null,
    completedAt: null,
    note: null,
  }))
}
