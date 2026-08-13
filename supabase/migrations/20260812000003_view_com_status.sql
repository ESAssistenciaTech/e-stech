-- "A receber" é a soma dos saldos das OS já entregues que ainda devem.
-- Sem o status dentro da view, isso vira duas consultas e um cruzamento na
-- aplicação. Com ele, é um filtro só.
--
-- Colunas novas entram no fim: create or replace view exige que as
-- anteriores mantenham nome, tipo e ordem.

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
  os.cliente_id
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
