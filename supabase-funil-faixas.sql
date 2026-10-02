-- Funil por faixas (frio / morno / quente / ultra quente): libera as etapas novas.
-- As etapas antigas continuam valendo, então nenhum lead existente é afetado.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.leads'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%etapa%'
  loop
    execute format('alter table public.leads drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.leads add constraint leads_etapa_check
  check (etapa in (
    'novo', 'contato_feito', 'follow_up',
    'qualificado', 'reuniao_marcada', 'reuniao_feita', 'no_show',
    'proposta_enviada', 'negociacao',
    'ganho', 'perdido'
  ));

notify pgrst, 'reload schema';
