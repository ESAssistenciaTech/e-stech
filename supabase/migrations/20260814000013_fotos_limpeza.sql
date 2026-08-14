-- Limpeza de fotos.
--
-- O plano gratuito do Cloudinary tem teto, e foto de aparelho é o único dado
-- do sistema que cresce sozinho. A limpeza é manual por decisão: apagar prova
-- de estado automaticamente, no dia em que a garantia vence, é o tipo de
-- automatismo que um dia apaga justo a foto de que se precisava.

-- Quanto cada foto ocupa de verdade. O navegador já sabe o tamanho depois de
-- comprimir; era só não estar guardando. Sem isto, "ordenar por espaço" seria
-- ordenar por chute.
alter table os_fotos add column bytes int;

-- ---------------------------------------------------------------------------
-- O que já pode ser apagado
-- ---------------------------------------------------------------------------

-- Garantia vence por serviço, não por OS (ADR 0011): a que vale para segurar
-- a foto é a maior delas. OS sem serviço nenhum, cancelada ou recusada, cai
-- com garantia zero — vence na entrega, que é quando o aparelho saiu da mão.
--
-- security_invoker = on, como toda view daqui: sem isso ela roda com
-- privilégio do dono e ignora o RLS das tabelas de baixo.
create view os_fotos_limpeza with (security_invoker = on) as
select
  os.id,
  os.numero,
  os.codigo_publico,
  os.status,
  os.data_entrega,
  coalesce(g.garantia_dias, 0) as garantia_dias,
  os.data_entrega + make_interval(days => coalesce(g.garantia_dias, 0))
    as garantia_ate,
  f.fotos,
  f.bytes
from ordens_servico os
-- Só entra quem tem foto: `on f.fotos > 0` é o filtro.
join lateral (
  select
    count(*)::int as fotos,
    -- Foto antiga não tem tamanho gravado. 200 KB é o que a compressão a
    -- 1280px com qualidade 75 costuma entregar — estimativa declarada, para
    -- a ordenação não desabar por causa das linhas velhas.
    sum(coalesce(bytes, 200000))::bigint as bytes
  from os_fotos
  where ordem_servico_id = os.id
) f on f.fotos > 0
left join lateral (
  select max(garantia_dias) as garantia_dias
  from os_servicos
  where ordem_servico_id = os.id
) g on true
where os.data_entrega is not null;

comment on view os_fotos_limpeza is
  'OS já entregues que ainda guardam foto, com a data em que a garantia '
  'vence e o espaço ocupado. Alimenta a tela de limpeza — nada aqui apaga '
  'nada sozinho.';
