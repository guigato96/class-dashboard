-- Adiciona a coluna que guarda o último mês ativo de um contrato (cancelamento agendado).
alter table clientes add column if not exists data_fim_contrato date;

-- O cancelamento antigo marcava ativo=false na hora, o que sumia o cliente de TODOS os
-- meses (inclusive os já passados/atuais em que ele ainda esteve ativo). Isso não é mais
-- necessário agora que o fim de contrato é controlado por mês via data_fim_contrato.
-- Reativa quem tiver sido cancelado por esse fluxo antigo, pra você recadastrar o fim do
-- contrato certinho pela tela (com o mês correto) depois de rodar este script.
update clientes set ativo = true where ativo = false;
