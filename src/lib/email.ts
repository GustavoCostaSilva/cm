import nodemailer from 'nodemailer'
import type { OfficeConfig, StageKey } from '@/types'
import { STAGE_LABELS } from '@/types'

export type StageMailKind = 'completed' | 'flag' | 'update'

interface StageMailInput {
  to: string
  clientName: string
  stageKey: StageKey
  kind: StageMailKind
  message: string
  portalUrl: string
  office: OfficeConfig
}

export interface MailResult {
  delivered: boolean
  dev: boolean
}

function transporter() {
  const host = process.env.SMTP_HOST
  if (!host) return null
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderEmail(p: {
  headline: string
  clientName: string
  message: string
  portalUrl: string
  office: OfficeConfig
}): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f6fb;font-family:Inter,Arial,Helvetica,sans-serif;color:#0f1b2d;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,27,45,.08);">
      <div style="height:6px;background:linear-gradient(90deg,#b22234 0 33%,#ffffff 33% 66%,#1b3a6b 66% 100%);"></div>
      <div style="padding:30px 32px;">
        <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#5b6b82;">${escapeHtml(p.office.officeName)}</div>
        <h1 style="font-size:20px;margin:8px 0 18px;color:#0f1b2d;">${escapeHtml(p.headline)}</h1>
        <p style="margin:0 0 12px;">Olá ${escapeHtml(p.clientName)},</p>
        <p style="margin:0 0 22px;line-height:1.65;color:#34435a;">${escapeHtml(p.message)}</p>
        <a href="${p.portalUrl}" style="display:inline-block;background:#1b3a6b;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:10px;">Acompanhar meu caso</a>
      </div>
      <div style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e8edf5;font-size:13px;color:#5b6b82;line-height:1.6;">
        <strong style="color:#1b3a6b;">${escapeHtml(p.office.officeName)}</strong> · ${escapeHtml(p.office.attorney)}<br/>
        ${escapeHtml(p.office.phone)} · ${escapeHtml(p.office.email)}
      </div>
    </div>
    <p style="text-align:center;color:#9aa7bb;font-size:11px;margin-top:16px;line-height:1.5;">Você recebe este e-mail por ser cliente acompanhado pela ${escapeHtml(p.office.officeName)}.<br/>Este é um canal informativo — em caso de dúvida, fale diretamente com o escritório.</p>
  </div></body></html>`
}

export async function sendStageNotification(input: StageMailInput): Promise<MailResult> {
  const { to, clientName, stageKey, kind, message, portalUrl, office } = input
  const stageLabel = STAGE_LABELS[stageKey]
  const headline =
    kind === 'completed'
      ? `Etapa concluída: ${stageLabel}`
      : kind === 'flag'
        ? `Atualização importante: ${stageLabel}`
        : `Atualização do seu caso: ${stageLabel}`
  const subject = `${office.officeName} — ${headline}`
  const html = renderEmail({ headline, clientName, message, portalUrl, office })
  const text = `${headline}\n\nOlá ${clientName},\n\n${message}\n\nAcompanhe seu caso: ${portalUrl}\n\n${office.officeName} · ${office.attorney}\n${office.phone} · ${office.email}`

  const t = transporter()
  if (!t) {
    console.log('\n────────── [email:dev — SMTP não configurado] ──────────')
    console.log('Para:    ', to)
    console.log('Assunto: ', subject)
    console.log(text)
    console.log('─────────────────────────────────────────────────────\n')
    return { delivered: false, dev: true }
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || `${office.officeName} <${office.email}>`,
    replyTo: office.email || undefined,
    to,
    subject,
    text,
    html,
  })
  return { delivered: true, dev: false }
}
