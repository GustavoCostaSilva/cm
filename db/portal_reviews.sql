-- Technical reviews per client (manual §Etapa 7 / §10.1).
-- Each row is one review attempt by the Revisor Técnico: outcome (approved or
-- returned) plus the list of errors found, classified by severity. Rounds are
-- counted to enforce the "max 2 rounds, 3rd return escalates" rule.
create table if not exists portal_reviews (
  id          text primary key,
  client_id   text not null references portal_clients(id) on delete cascade,
  round       int  not null default 1,
  reviewer    text,
  outcome     text not null check (outcome in ('approved', 'returned')),
  errors      jsonb not null default '[]',  -- [{ severity, field, note }]
  created_at  timestamptz not null default now()
);
create index if not exists portal_reviews_client_idx on portal_reviews(client_id);
