# GoVisa Portal

Sistema com **dois portais** em um único app Next.js:

- **Portal do Cliente** (`/`) — o cliente acompanha o andamento do caso por etapas, com tempo em cada etapa, histórico do que foi feito e contato do escritório sempre visível.
- **Case Management** (`/gestao`) — a equipe gerencia todos os clientes: lista, agenda de prazos, histórico e gestão das etapas, com notificação por e-mail ao cliente.

Marca: **Go Visa Law Firm — Mr. Jeffrey Weingrad**.

## Como rodar

Pré-requisito: Node.js 18+.

```bash
cd govisa-portal
npm install
npm run dev -- -p 3100
```

Ou, no Windows, dê dois cliques em **`iniciar-portal.bat`** (na pasta `D:\GOVISA`).

- Portal do Cliente: <http://localhost:3100>
- Case Management: <http://localhost:3100/gestao>

## Acessos de demonstração

**Case Management (equipe):**

| E-mail | Senha |
| --- | --- |
| `admin@govisa.local` | `govisa2026` |

**Portal do Cliente** — login = passaporte, senha = data de nascimento:

| Cliente | Passaporte | Nascimento | Etapa |
| --- | --- | --- | --- |
| Ana Beatriz Souza | `FN481223` | 1991-03-14 | Consulta |
| Carlos Mendes Oliveira | `GH772900` | 1985-11-02 | Documentação |
| Mariana Costa Lima | `FP315544` | 1993-07-22 | Protocolo |
| João Pedro Almeida | `GA908112` | 1979-01-30 | Audiência |
| Patrícia Gomes | `FP771039` | 1982-12-05 | Concluído |

## E-mails

As notificações usam SMTP via `nodemailer`. Copie `.env.example` para `.env.local` e preencha as variáveis `SMTP_*`.

Sem SMTP configurado (padrão em dev), os e-mails **não são enviados** — o conteúdo é impresso no console do servidor, útil para testar.

## Dados

Banco local em arquivos JSON na pasta `data/` (criados automaticamente com dados fictícios na primeira execução). Para **resetar** a demonstração, apague os arquivos `data/*.json` e reinicie o servidor.

## Etapas do caso

`Consulta → Documentação → Protocolo → Audiência → Decisão` (fluxo de imigração). Ao concluir uma etapa, a próxima é ativada automaticamente.

## Segurança

- Senha da equipe: hash `scrypt`; sessão JWT (jose) em cookie httpOnly.
- O login do cliente (passaporte + nascimento) tem baixa entropia e por isso é protegido por **rate limiting** (bloqueio temporário após várias tentativas).
- Antes de produção: defina um `SESSION_SECRET` forte no `.env.local`.

## Estrutura

```
src/
  app/                  # rotas (cliente em /, equipe em /gestao)
  app/api/auth/         # login/logout (cliente e equipe)
  app/api/staff/        # APIs do Case Management
  components/client/    # UI do portal do cliente
  components/staff/     # UI do Case Management
  lib/                  # db (JSON), auth, sessão, e-mail, seed, utilidades
  proxy.ts              # proteção de rotas (Next.js 16)
```
