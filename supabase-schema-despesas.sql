-- ============================================================
-- Gestão de Clientes — Class
-- Módulo de Despesas (rodar no SQL Editor do Supabase)
-- ============================================================

-- Tabela principal: despesa "template" (fixa ou recorrente)
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text not null default 'outros'
    check (categoria in ('ferramentas', 'trafego', 'folha', 'aluguel', 'impostos', 'outros')),
  valor numeric(10,2) not null default 0,
  recorrente boolean not null default true,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.despesas is 'Despesas da operação da Class: fixas/recorrentes ou pontuais.';

drop trigger if exists trg_despesas_updated_at on public.despesas;
create trigger trg_despesas_updated_at
  before update on public.despesas
  for each row execute function public.set_updated_at();

-- Histórico mensal de cada despesa (1:N com despesas)
create table if not exists public.historico_despesas (
  id uuid primary key default gen_random_uuid(),
  despesa_id uuid not null references public.despesas(id) on delete cascade,
  mes_referencia date not null,
  valor numeric(10,2) not null default 0,
  pago boolean not null default false,
  data_pagamento date,
  created_at timestamptz not null default now(),
  unique (despesa_id, mes_referencia)
);

comment on table public.historico_despesas is 'Lançamento mensal de cada despesa (valor e status de pagamento daquele mês).';

create index if not exists idx_historico_despesas_mes on public.historico_despesas (mes_referencia);
create index if not exists idx_historico_despesas_despesa on public.historico_despesas (despesa_id);

-- RLS — mesma regra das outras tabelas: só acesso autenticado
alter table public.despesas enable row level security;
alter table public.historico_despesas enable row level security;

drop policy if exists "acesso autenticado despesas" on public.despesas;
create policy "acesso autenticado despesas" on public.despesas
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "acesso autenticado historico_despesas" on public.historico_despesas;
create policy "acesso autenticado historico_despesas" on public.historico_despesas
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
