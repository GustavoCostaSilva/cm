-- Documents per client (manual §6/§7). Files stored on the VPS disk; metadata here.
create table if not exists portal_documents (
  id                text primary key,
  client_id         text not null references portal_clients(id) on delete cascade,
  category          text,
  original_name     text not null,
  stored_name       text not null,
  mime              text,
  size_bytes        bigint not null default 0,
  uploaded_by       text,
  uploaded_at       timestamptz not null default now(),
  visible_to_client boolean not null default false
);
create index if not exists portal_documents_client_idx on portal_documents(client_id);
