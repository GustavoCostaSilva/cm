-- Two-way messages between the client and the office.
create table if not exists portal_messages (
  id          text primary key,
  client_id   text not null references portal_clients(id) on delete cascade,
  sender      text not null check (sender in ('client','staff')),
  author_name text not null,
  text        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists portal_messages_client_idx on portal_messages(client_id);
