-- ============================================================
-- Valor cobrado por mês, independente do valor_mensal recorrente
-- Permite ajustar a cobrança de um mês específico (ex: mês avulso
-- maior/menor) sem alterar o valor do plano do cliente daqui pra frente.
-- ============================================================

alter table public.historico_pagamentos add column if not exists valor_previsto numeric(10,2);

-- Backfill: usa o valor já pago quando existir, senão o valor_mensal atual do cliente
update public.historico_pagamentos hp
set valor_previsto = coalesce(hp.valor_pago, c.valor_mensal, 0)
from public.clientes c
where c.id = hp.cliente_id and hp.valor_previsto is null;

alter table public.historico_pagamentos alter column valor_previsto set not null;
alter table public.historico_pagamentos alter column valor_previsto set default 0;

comment on column public.historico_pagamentos.valor_previsto is
  'Valor cobrado nesse mês específico — pode divergir do valor_mensal recorrente do cliente (ajuste pontual, sem afetar o plano).';
