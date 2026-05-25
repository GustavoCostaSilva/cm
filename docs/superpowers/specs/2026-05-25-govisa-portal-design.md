# GoVisa Portal — Documento de Design

**Data:** 2026-05-25
**Status:** Aprovado
**Pasta:** `D:\GOVISA\govisa-portal` (sistema novo e independente — separado de `govisa-system`)

## 1. Objetivo

Sistema local com **dois portais** em um único app Next.js:

1. **Portal do Cliente** — login simples (passaporte + data de nascimento); acompanhamento do caso em etapas, com tempo em cada etapa, relatório do que foi feito (transparência), e contato sempre visível.
2. **Case Management** — login (email + senha) para a equipe gerenciar todos os clientes: lista, agenda de prazos, histórico, e gestão de etapas com notificação por email ao cliente.

Marca: **Go Visa Law Firm — Mr. Jeffrey Weingrad**. Paleta navy `#1b3a6b` + flag-red `#b22234` + dourado `#c9a227`, fonte Inter (consistente com o sistema interno existente).

## 2. Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4 + shadcn/ui (base-ui) — reaproveitados do sistema existente
- Store local em arquivos JSON (`node:fs`), auto-seed quando vazio
- `jose` (JWT em cookie httpOnly) para sessão; `scrypt` (node:crypto) para senha da equipe
- `nodemailer` (SMTP) para notificações, com fallback de console em dev
- `date-fns` (pt-BR) para datas e cálculo de tempo por etapa

## 3. Rotas

**Cliente** (raiz):
- `/` → login (passaporte + nascimento)
- `/meu-caso` → painel de acompanhamento (sessão `gv_client`)

**Case Management** (`/gestao`):
- `/gestao` → login (email + senha)
- `/gestao/clientes` → lista de clientes
- `/gestao/clientes/[id]` → ficha (etapas, histórico, prazos)
- `/gestao/agenda` → calendário de prazos

Duas sessões independentes (cookies distintos), protegidas pelo `middleware`. Cliente não acessa `/gestao` e vice-versa.

## 4. Modelo de dados (`data/*.json`)

- **Client**: `id, fullName, passport, dateOfBirth, email, phone, whatsapp, caseType, assignedTo, status, createdAt`
- **StageProgress** (por cliente): `key, label, status (pending|active|done), startedAt, completedAt, note`
- **CaseEvent** (histórico/relatório): `id, clientId, stageKey, type (note|stage_started|stage_completed|flag|deadline), text, author, createdAt, visibleToClient, notified`
- **Deadline**: `id, clientId, title, dueDate, status, stageKey`
- **StaffUser**: `id, email, passwordHash, name, role, active, createdAt`
- **OfficeConfig**: `officeName, attorney, phone, whatsapp, email, disclaimerText`

## 5. Etapas (fluxo de imigração, ajustáveis)

`consulta` → `documentacao` → `protocolo` → `audiencia` → `decisao`
(Consulta · Documentação · Protocolo/Filing · Audiência/Court · Decisão)

Tempo em cada etapa derivado de `startedAt`/`completedAt`.

## 6. Fluxos principais

- **Cliente entra** → vê stepper das etapas, etapa atual, tempo em cada uma, linha do tempo dos eventos visíveis, próximo prazo, e card de contato.
- **Equipe gerencia etapa** → inicia/conclui/sinaliza etapa e adiciona notas; checkbox "notificar cliente" (default ligado em concluir/sinalizar) gera `CaseEvent` e dispara email.
- **Email** → template pt-BR com status da etapa e link para o portal.

## 7. Segurança

- Senha da equipe: `scrypt` salgado; sessão JWT HS256 (jose) em cookie httpOnly, 7 dias.
- Login do cliente (passaporte + nascimento) tem baixa entropia → **rate limiting / bloqueio temporário** por passaporte+IP após N tentativas.
- `SESSION_SECRET` e SMTP via `.env`.

## 8. Design / UX

- Cliente: acolhedor, simples, mobile-first; rodapé fixo com disclaimer de proteção + card de contato (WhatsApp, telefone, email) sempre visível.
- Gestão: denso e funcional; tabela com busca, calendário, ficha com abas.
- Estados de loading/erro/vazio caprichados; micro-interações discretas; nada de "cara de IA".

## 9. Seed (dados fake)

Auto-seed na primeira execução: ~8–10 clientes fictícios em etapas variadas, com prazos, histórico e contatos; 1 conta de equipe (`admin@govisa.local`, senha documentada no README); `OfficeConfig` com WhatsApp/telefone placeholder.

## 10. Fora de escopo (v1)

- Migração para Supabase/produção (preparado, não feito).
- Upload de documentos, chat, pagamentos.
- Etapas configuráveis por cliente (pipeline é fixo nesta versão).
