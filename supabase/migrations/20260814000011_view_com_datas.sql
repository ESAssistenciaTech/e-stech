-- Relatório de lucro: a view precisa de data e de custo.
--
-- Sem a data dentro da view, filtrar "o lucro deste mês" vira duas consultas
-- e um cruzamento na aplicação — o mesmo motivo que trouxe o status para cá
-- na 0003. E sem o custo não dá para mostrar a composição do lucro
-- (mão de obra + peça vendida − custo da peça); só o resultado final, que é
-- justamente o número que ninguém sabe conferir.
--
-- Colunas novas entram no fim: create or replace view exige que as
-- anteriores mantenham nome, tipo e ordem.
--
-- custo_peca continua sendo dado interno. Estar na view não muda isso: a
-- view é security_invoker e anônimo não tem política nenhuma nas tabelas de
-- baixo. Não imprimir em comprovante nem devolver por portal.

create or replace view ordens_servico_totais with (security_invoker = on) as
select
  os.id,
  coalesce(serv.valor_mao_obra, 0) as valor_mao_obra,
  os.valor_peca + coalesce(serv.valor_mao_obra, 0) as valor_total,
  coalesce(pago.valor_pago, 0) as valor_pago,
  os.valor_peca + coalesce(serv.valor_mao_obra, 0) - coalesce(pago.valor_pago, 0) as saldo,
  os.valor_peca + coalesce(serv.valor_mao_obra, 0) - os.custo_peca as lucro,
  os.status,
  os.numero,
  os.codigo_publico,
  os.cliente_id,
  os.custo_peca,
  os.data_entrega
from ordens_servico os
left join lateral (
  select sum(valor) as valor_mao_obra
  from os_servicos
  where ordem_servico_id = os.id
) serv on true
left join lateral (
  select sum(valor) as valor_pago
  from movimentacoes_caixa
  where ordem_servico_id = os.id and tipo = 'entrada'
) pago on true;

-- ---------------------------------------------------------------------------
-- Data de entrega também no insert
-- ---------------------------------------------------------------------------

-- O gatilho da 0001 era `before update`: OS nascida já como 'entregue'
-- (serviço resolvido na hora, no balcão) ficava com data_entrega nula.
-- Sem data ela não cai em mês nenhum, e o lucro dela sumia do relatório
-- em silêncio — o pior tipo de erro de número.
--
-- No insert o OLD é nulo, e `old.status <> 'entregue'` com OLD nulo dá NULL,
-- que não é verdadeiro: por isso a condição precisa tratar o caso à parte,
-- não basta trocar o evento do gatilho.
create or replace function marcar_datas_por_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'pronto'
     and (old is null or old.status <> 'pronto')
     and new.data_conclusao is null then
    new.data_conclusao = now();
  end if;
  if new.status = 'entregue'
     and (old is null or old.status <> 'entregue')
     and new.data_entrega is null then
    new.data_entrega = now();
  end if;
  return new;
end;
$$;

-- `create or replace trigger` (Postgres 14+) em vez de drop e recria: troca
-- o gatilho de uma vez, sem instante nenhum em que a tabela fique sem ele.
create or replace trigger ordens_servico_datas
  before insert or update on ordens_servico
  for each row execute function marcar_datas_por_status();
