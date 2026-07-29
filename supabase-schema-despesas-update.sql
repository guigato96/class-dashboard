-- ============================================================
-- Gestão de Clientes — Class
-- Atualização do módulo de Despesas: categoria livre + parcelamento
-- (rodar no SQL Editor do Supabase, depois de já ter rodado o
-- supabase-schema-despesas.sql)
-- ============================================================

-- Categoria deixa de ser uma lista fixa e passa a aceitar texto livre
-- (ex: "Curso", "Mentoria"), mantendo as sugestões só na interface.
alter table public.despesas drop constraint if exists despesas_categoria_check;

-- Data da última parcela (opcional). Quando preenchida, a despesa
-- recorrente para de se repetir automaticamente após esse mês.
alter table public.despesas add column if not exists mes_final date;

comment on column public.despesas.mes_final is 'Último mês em que essa despesa recorrente deve ser lançada (parcelamento). Nulo = repete indefinidamente.';
