-- ============================================================
-- Funil Comercial — Class
-- Tabelas de leads e histórico de atividades (rodar no SQL Editor do Supabase)
-- ============================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  contato_nome text,
  contato_telefone text,
  contato_email text,

  etapa text not null default 'novo'
    check (etapa in ('novo', 'contato_feito', 'qualificado', 'reuniao_marcada', 'proposta_enviada', 'negociacao', 'ganho', 'perdido')),

  origem text not null default 'trafego_pago'
    check (origem in ('trafego_pago', 'indicacao', 'instagram', 'outbound', 'networking', 'site')),
  temperatura text not null default 'morno'
    check (temperatura in ('quente', 'morno', 'frio')),
  nicho text,
  plataformas_interesse text[] not null default '{}',

  valor_mensal_estimado numeric(10,2),

  proxima_acao text,
  data_proxima_acao date,

  data_entrada timestamptz not null default now(),
  data_ultima_interacao timestamptz,

  motivo_perda text,
  cliente_id uuid references public.clientes(id) on delete set null,

  payload_n8n jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.leads is 'Funil comercial da Class: leads/prospecção antes de virarem cliente.';
comment on column public.leads.payload_n8n is 'JSON cru recebido da automação (n8n) na criação do lead.';
comment on column public.leads.cliente_id is 'Preenchido quando o lead é convertido em cliente (etapa = ganho).';

create index if not exists idx_leads_etapa on public.leads (etapa);
create index if not exists idx_leads_telefone on public.leads (contato_telefone);
create index if not exists idx_leads_data_proxima_acao on public.leads (data_proxima_acao);

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- Histórico de atividades (notas, ligações, mudanças de etapa) — 1:N com leads
create table if not exists public.lead_atividades (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,

  tipo text not null
    check (tipo in ('nota', 'ligacao', 'whatsapp', 'email', 'reuniao', 'proposta', 'mudanca_etapa')),
  descricao text,

  etapa_de text,
  etapa_para text,

  data timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.lead_atividades is 'Linha do tempo de cada lead: notas manuais e mudanças de etapa automáticas.';

create index if not exists idx_lead_atividades_lead_id on public.lead_atividades (lead_id, data desc);

-- Grava atividade automática toda vez que a etapa de um lead muda
create or replace function public.registrar_mudanca_etapa()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'UPDATE' and new.etapa is distinct from old.etapa then
    insert into public.lead_atividades (lead_id, tipo, etapa_de, etapa_para)
    values (new.id, 'mudanca_etapa', old.etapa, new.etapa);
    new.data_ultima_interacao := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_leads_mudanca_etapa on public.leads;
create trigger trg_leads_mudanca_etapa
  before update on public.leads
  for each row execute function public.registrar_mudanca_etapa();

-- RLS: mesmo padrão de acesso autenticado usado nas outras tabelas do Class
alter table public.leads enable row level security;
alter table public.lead_atividades enable row level security;

drop policy if exists "acesso autenticado leads" on public.leads;
create policy "acesso autenticado leads" on public.leads
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "acesso autenticado lead_atividades" on public.lead_atividades;
create policy "acesso autenticado lead_atividades" on public.lead_atividades
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- Webhook do n8n: função que recebe o payload cru e cria/atualiza o lead
-- Chamada via POST https://<supabase>/rest/v1/rpc/receber_lead
-- Body: { "payload": { ...campos do n8n... } }
-- Dedup por telefone: se já existir um lead ativo com o mesmo telefone,
-- não cria duplicado — só registra uma atividade "procurou de novo".
-- ============================================================
create or replace function public.receber_lead(payload jsonb)
returns public.leads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_telefone text;
  v_lead public.leads;
  v_temperatura text;
begin
  v_telefone := regexp_replace(coalesce(payload->>'telefone', payload->>'contato_telefone', payload->>'whatsapp_link', ''), '\D', '', 'g');

  v_temperatura := payload->>'temperatura';
  if v_temperatura not in ('quente', 'morno', 'frio') then
    v_temperatura := 'morno';
  end if;

  if v_telefone <> '' then
    select * into v_lead
    from public.leads
    where regexp_replace(coalesce(contato_telefone, ''), '\D', '', 'g') = v_telefone
      and etapa not in ('ganho', 'perdido')
    limit 1;
  end if;

  if v_lead.id is not null then
    insert into public.lead_atividades (lead_id, tipo, descricao)
    values (v_lead.id, 'nota', 'Lead procurou de novo via automação (n8n).');
    return v_lead;
  end if;

  insert into public.leads (
    nome, contato_nome, contato_telefone, contato_email,
    origem, temperatura, nicho, plataformas_interesse, payload_n8n
  )
  values (
    coalesce(payload->>'nome', payload->>'empresa', 'Lead sem nome'),
    payload->>'contato_nome',
    nullif(v_telefone, ''),
    payload->>'email',
    coalesce(payload->>'origem', 'trafego_pago'),
    v_temperatura,
    payload->>'nicho',
    case when payload ? 'plataformas_interesse'
      then array(select jsonb_array_elements_text(payload->'plataformas_interesse'))
      else '{}'::text[]
    end,
    payload
  )
  returning * into v_lead;

  return v_lead;
end;
$$;

comment on function public.receber_lead(jsonb) is 'Endpoint de entrada do n8n: cria lead novo ou registra retorno de lead existente, deduplicando por telefone.';

grant execute on function public.receber_lead(jsonb) to anon, authenticated;
