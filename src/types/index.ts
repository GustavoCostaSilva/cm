// ── Domain model for the GoVisa Portal, aligned to the firm's
//    "Manual Operacional — Departamento de Preparação de Processos" (v2.1). ──

// ─────────────────────────────────────────────────────────────
// Operational pipeline — 11 stages (internal / case-management view)
// ─────────────────────────────────────────────────────────────
export const STAGE_KEYS = [
  'onboarding',
  'coleta',
  'elegibilidade',
  'analise',
  'preenchimento',
  'assinaturas',
  'revisao',
  'correcao',
  'validacao',
  'envio',
  'acompanhamento',
] as const

export type StageKey = (typeof STAGE_KEYS)[number]

export const STAGE_LABELS: Record<StageKey, string> = {
  onboarding: 'Onboarding',
  coleta: 'Coleta de Documentos',
  elegibilidade: 'Análise de Elegibilidade',
  analise: 'Análise do Caso',
  preenchimento: 'Preenchimento',
  assinaturas: 'Coleta de Assinaturas',
  revisao: 'Revisão Técnica',
  correcao: 'Correção',
  validacao: 'Validação Final',
  envio: 'Envio',
  acompanhamento: 'Acompanhamento USCIS',
}

// Short internal description per stage (shown to staff).
export const STAGE_DESCRIPTIONS: Record<StageKey, string> = {
  onboarding: 'Confirmação de pagamento, criação do cliente e abertura do processo.',
  coleta: 'Solicitação e recebimento dos documentos (checklist por visto).',
  elegibilidade: 'Verificação de elegibilidade do visto e impedimentos.',
  analise: 'Estratégia do caso, base legal e mapeamento de gaps.',
  preenchimento: 'Preenchimento dos formulários USCIS e documentos narrativos.',
  assinaturas: 'Coleta e conferência das assinaturas do cliente.',
  revisao: 'Revisão técnica de 100% do processo antes do envio.',
  correcao: 'Correção dos apontamentos do Revisor.',
  validacao: 'Conferência dupla final (Case Manager + Revisor).',
  envio: 'Impressão, organização e envio rastreável ao USCIS/EOIR.',
  acompanhamento: 'Recibos, biometria, RFE e decisão do USCIS.',
}

// ─────────────────────────────────────────────────────────────
// Staff roles (manual §2.1)
// ─────────────────────────────────────────────────────────────
export const STAFF_ROLES = [
  'coordenador',
  'assistente_coletor',
  'case_manager',
  'revisor_tecnico',
  'assistente_juridico',
] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export const ROLE_LABELS: Record<StaffRole, string> = {
  coordenador: 'Coordenador de Casos',
  assistente_coletor: 'Assistente — Coletor',
  case_manager: 'Case Manager',
  revisor_tecnico: 'Revisor Técnico',
  assistente_juridico: 'Assistente Jurídico',
}

// Primary responsible role per stage (manual §15 — Matriz de Responsabilidade).
export const STAGE_RESPONSIBLE: Record<StageKey, StaffRole> = {
  onboarding: 'assistente_coletor',
  coleta: 'assistente_coletor',
  elegibilidade: 'assistente_coletor',
  analise: 'case_manager',
  preenchimento: 'assistente_coletor',
  assinaturas: 'assistente_juridico',
  revisao: 'revisor_tecnico',
  correcao: 'case_manager',
  validacao: 'case_manager',
  envio: 'assistente_juridico',
  acompanhamento: 'assistente_juridico',
}

// SLA per stage in hours (manual §9). acompanhamento is ongoing (0 = no SLA).
export const STAGE_SLA_HOURS: Record<StageKey, { normal: number; urgent: number }> = {
  onboarding: { normal: 12, urgent: 2 },
  coleta: { normal: 24, urgent: 12 },
  elegibilidade: { normal: 24, urgent: 12 },
  analise: { normal: 48, urgent: 24 },
  preenchimento: { normal: 48, urgent: 24 },
  assinaturas: { normal: 168, urgent: 48 },
  revisao: { normal: 48, urgent: 24 },
  correcao: { normal: 24, urgent: 4 },
  validacao: { normal: 24, urgent: 4 },
  envio: { normal: 24, urgent: 8 },
  acompanhamento: { normal: 0, urgent: 0 },
}

// ─────────────────────────────────────────────────────────────
// Client-facing milestones — friendly grouping of the 11 stages
// ─────────────────────────────────────────────────────────────
export interface ClientMilestone {
  key: string
  label: string
  description: string
  stages: StageKey[]
}

export const CLIENT_MILESTONES: ClientMilestone[] = [
  {
    key: 'recebido',
    label: 'Caso recebido',
    description: 'Recebemos o seu caso e iniciamos a organização dos documentos.',
    stages: ['onboarding', 'coleta'],
  },
  {
    key: 'preparando',
    label: 'Preparando seu processo',
    description: 'Analisamos seu caso e preparamos os formulários e as evidências.',
    stages: ['elegibilidade', 'analise', 'preenchimento'],
  },
  {
    key: 'revisao_assinatura',
    label: 'Revisão e assinatura',
    description: 'Coletamos suas assinaturas e revisamos cada detalhe do processo.',
    stages: ['assinaturas', 'revisao', 'correcao', 'validacao'],
  },
  {
    key: 'enviado',
    label: 'Enviado às autoridades',
    description: 'Seu processo foi enviado ao USCIS/EOIR com envio rastreável.',
    stages: ['envio'],
  },
  {
    key: 'acompanhamento',
    label: 'Acompanhamento',
    description: 'Acompanhamos recibos, biometria e a decisão sobre o seu caso.',
    stages: ['acompanhamento'],
  },
]

// ─────────────────────────────────────────────────────────────
// Visa types & eligibility (manual §5)
// ─────────────────────────────────────────────────────────────
export const VISA_TYPES = ['T-Visa', 'U-Visa', 'VAWA'] as const
export type VisaType = (typeof VISA_TYPES)[number]

export type Eligibility = 'pending' | 'eligible' | 'ineligible'

export const ELIGIBILITY_LABELS: Record<Eligibility, string> = {
  pending: 'Pendente de análise',
  eligible: 'Elegível',
  ineligible: 'Inelegível',
}

// ─────────────────────────────────────────────────────────────
// Core entities
// ─────────────────────────────────────────────────────────────
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
  | 'uscis_letter'

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
  dateOfBirth: string // YYYY-MM-DD — portal password
  email: string | null
  phone: string | null
  whatsapp: string | null
  caseType: VisaType | null // visa type (T-Visa / U-Visa / VAWA)
  urgent: boolean
  eligibility: Eligibility
  assignedTo: string | null // case manager (staff id)
  status: ClientStatus
  createdAt: string
  stages: StageProgress[]
}

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
  whatsapp: string // digits only
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
