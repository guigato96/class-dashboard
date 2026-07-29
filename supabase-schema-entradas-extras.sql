-- ============================================================
-- Gestão de Clientes — Class
-- Módulo de Entradas extras (rodar no SQL Editor do Supabase)
-- Receitas avulsas, fora do contrato fixo de clientes
-- (ex: venda de página, serviço avulso, consultoria pontual)
-- ============================================================

create table if not exists public.entradas_extras (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text not null default 'Outros',
  valor numeric(10,2) not null default 0,
  data_entrada date not null default current_date,
  mes_referencia date not null,
  recebido boolean not null default false,
  data_recebimento date,
  observacao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.entradas_extras is 'Receitas avulsas/pontuais da Class, fora do contrato fixo de clientes.';

drop trigger if exists trg_entradas_extras_updated_at on public.entradas_extras;
create trigger trg_entradas_extras_updated_at
  before update on public.entradas_extras
  for each row execute function public.set_updated_at();

create index if not exists idx_entradas_extras_mes on public.entradas_extras (mes_referencia);

alter table public.entradas_extras enable row level security;

drop policy if exists "acesso autenticado entradas_extras" on public.entradas_extras;
create policy "acesso autenticado entradas_extras" on public.entradas_extras
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
