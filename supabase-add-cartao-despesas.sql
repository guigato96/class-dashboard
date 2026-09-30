-- Adiciona a tag "gasto no cartão" às despesas, pra dar pra somar quanto sai do cartão.
alter table despesas add column if not exists cartao boolean not null default false;
