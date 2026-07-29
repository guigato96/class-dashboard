-- ============================================================
-- Gestão de Clientes — Class
-- Importação do histórico da planilha antiga (Fev-Jun/2026)
-- Rodar uma única vez no SQL Editor do Supabase
-- ============================================================

do $$
declare
  v_mentoria_shark uuid;
  v_trafego_pago uuid;
  v_respondi uuid;
  v_calendly uuid;
  v_chatgpt uuid;
  v_clickup uuid;
  v_claude_code uuid;
  v_clonador_site uuid;
begin
  -- Entradas extras (Faturamento Fev-Jun/2026) — total de clientes por mês,
  -- sem detalhamento por cliente individual (a planilha antiga só tinha o bolo)
  insert into public.entradas_extras (descricao, categoria, valor, data_entrada, mes_referencia, recebido, data_recebimento)
  values
    ('Receita de clientes (histórico planilha antiga)', 'Histórico', 12800.00, '2026-02-01', '2026-02-01', true, '2026-02-01'),
    ('Receita de clientes (histórico planilha antiga)', 'Histórico', 14080.00, '2026-03-01', '2026-03-01', true, '2026-03-01'),
    ('Receita de clientes (histórico planilha antiga)', 'Histórico', 14090.00, '2026-04-01', '2026-04-01', true, '2026-04-01'),
    ('Receita de clientes (histórico planilha antiga)', 'Histórico', 11600.00, '2026-05-01', '2026-05-01', true, '2026-05-01'),
    ('Receita de clientes (histórico planilha antiga)', 'Histórico', 12200.00, '2026-06-01', '2026-06-01', true, '2026-06-01');

  -- Despesas (templates)
  insert into public.despesas (descricao, categoria, valor, recorrente, mes_final)
  values ('Mentoria Shark', 'Curso', 481.74, true, null)
  returning id into v_mentoria_shark;

  insert into public.despesas (descricao, categoria, valor, recorrente, mes_final)
  values ('Tráfego pago', 'Tráfego próprio', 1669.00, true, '2026-06-01')
  returning id into v_trafego_pago;

  insert into public.despesas (descricao, categoria, valor, recorrente, mes_final)
  values ('Respondi', 'Ferramentas', 187.00, true, '2026-06-01')
  returning id into v_respondi;

  insert into public.despesas (descricao, categoria, valor, recorrente, mes_final)
  values ('Calendly', 'Ferramentas', 66.00, true, '2026-06-01')
  returning id into v_calendly;

  insert into public.despesas (descricao, categoria, valor, recorrente, mes_final)
  values ('ChatGPT / GPT', 'Ferramentas', 99.00, true, '2026-06-01')
  returning id into v_chatgpt;

  insert into public.despesas (descricao, categoria, valor, recorrente, mes_final)
  values ('ClickUp', 'Ferramentas', 110.00, true, '2026-06-01')
  returning id into v_clickup;

  insert into public.despesas (descricao, categoria, valor, recorrente, mes_final)
  values ('Claude Code', 'Ferramentas', 120.00, true, '2026-06-01')
  returning id into v_claude_code;

  insert into public.despesas (descricao, categoria, valor, recorrente, mes_final)
  values ('Clonador de site', 'Ferramentas', 55.00, false, null)
  returning id into v_clonador_site;

  -- Histórico mensal de cada despesa (valor real daquele mês, já quitado).
  -- Mentoria Shark para em junho aqui: julho é o mês atual e agosto/setembro
  -- ainda não aconteceram, então o próprio app vai gerar esses meses sozinho
  -- (como despesa recorrente normal, pendente até você marcar como paga).
  insert into public.historico_despesas (despesa_id, mes_referencia, valor, pago, data_pagamento)
  values
    (v_mentoria_shark, '2026-02-01', 481.74, true, '2026-02-01'),
    (v_mentoria_shark, '2026-03-01', 481.74, true, '2026-03-01'),
    (v_mentoria_shark, '2026-04-01', 481.74, true, '2026-04-01'),
    (v_mentoria_shark, '2026-05-01', 481.74, true, '2026-05-01'),
    (v_mentoria_shark, '2026-06-01', 481.74, true, '2026-06-01'),

    (v_trafego_pago, '2026-02-01', 1054.00, true, '2026-02-01'),
    (v_trafego_pago, '2026-03-01', 1515.55, true, '2026-03-01'),
    (v_trafego_pago, '2026-04-01', 2600.00, true, '2026-04-01'),
    (v_trafego_pago, '2026-05-01', 1800.00, true, '2026-05-01'),
    (v_trafego_pago, '2026-06-01', 1669.00, true, '2026-06-01'),

    (v_respondi, '2026-02-01', 187.00, true, '2026-02-01'),
    (v_respondi, '2026-03-01', 187.00, true, '2026-03-01'),
    (v_respondi, '2026-05-01', 187.00, true, '2026-05-01'),
    (v_respondi, '2026-06-01', 187.00, true, '2026-06-01'),

    (v_calendly, '2026-02-01', 66.00, true, '2026-02-01'),
    (v_calendly, '2026-03-01', 66.00, true, '2026-03-01'),
    (v_calendly, '2026-04-01', 66.00, true, '2026-04-01'),
    (v_calendly, '2026-05-01', 66.00, true, '2026-05-01'),
    (v_calendly, '2026-06-01', 66.00, true, '2026-06-01'),

    (v_chatgpt, '2026-02-01', 100.00, true, '2026-02-01'),
    (v_chatgpt, '2026-03-01', 100.00, true, '2026-03-01'),
    (v_chatgpt, '2026-06-01', 99.00, true, '2026-06-01'),

    (v_clickup, '2026-02-01', 109.23, true, '2026-02-01'),
    (v_clickup, '2026-03-01', 109.23, true, '2026-03-01'),
    (v_clickup, '2026-04-01', 110.00, true, '2026-04-01'),
    (v_clickup, '2026-05-01', 110.00, true, '2026-05-01'),
    (v_clickup, '2026-06-01', 110.00, true, '2026-06-01'),

    (v_claude_code, '2026-04-01', 120.00, true, '2026-04-01'),
    (v_claude_code, '2026-05-01', 120.00, true, '2026-05-01'),
    (v_claude_code, '2026-06-01', 120.00, true, '2026-06-01'),

    (v_clonador_site, '2026-04-01', 55.00, true, '2026-04-01');
end $$;
