-- Insumos e lista de compras. Ver ADR 0006 e CONTEXT.md.
--
-- Não é controle de estoque, e não vira um: nenhum consumo em OS desconta
-- quantidade. Baixa automática exigiria registrar cola e parafuso item a item
-- durante o conserto, o que para de acontecer em duas semanas — e aí o número
-- no sistema vira mentira, que é pior do que não ter número nenhum.
--
-- A quantidade é editada à mão e a pergunta principal não é "quantos eu
-- tenho?" e sim "o que eu preciso comprar?". Por isso a coluna que manda
-- nesta tabela é `precisa_repor`, não `quantidade`.

create table insumos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,

  -- Aproximada por natureza. Nenhum relatório financeiro pode depender dela.
  quantidade int not null default 0 check (quantidade >= 0),

  -- Marcação manual, feita na bancada ao perceber que acabou. Não é estoque
  -- mínimo nem alerta: ninguém calcula isto, o dono aperta.
  precisa_repor boolean not null default false,

  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- A consulta que existe é "o que está na lista de compras".
create index insumos_repor_idx on insumos (nome) where precisa_repor and ativo;

create trigger insumos_atualizado_em
  before update on insumos
  for each row execute function set_atualizado_em();

-- ---------------------------------------------------------------------------
-- Compra de insumo
-- ---------------------------------------------------------------------------

-- Sobe a quantidade E lança a saída no caixa no mesmo ato.
--
-- Em telas separadas, um dia um é feito e o outro esquecido — e aí ou o caixa
-- mente ou o estoque mente. Aqui é uma transação só: ou as duas coisas
-- acontecem, ou nenhuma.
--
-- security invoker de propósito (é o padrão, explicitado para não haver
-- dúvida): a função não empresta privilégio nenhum, e o RLS das tabelas de
-- baixo continua valendo para quem chamou.
create or replace function comprar_insumos(
  itens jsonb,
  valor numeric,
  forma forma_pagamento,
  observacao text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  comprados text;
begin
  if valor is null or valor <= 0 then
    raise exception 'O valor da compra precisa ser maior que zero.';
  end if;

  with pedido as (
    select
      (item->>'id')::uuid as id,
      (item->>'quantidade')::int as quantidade
    from jsonb_array_elements(itens) as item
    where (item->>'quantidade')::int > 0
  ),
  -- Comprou, então não precisa mais repor: a marcação cai pelo mesmo ato
  -- que sobe a quantidade.
  atualizados as (
    update insumos i
       set quantidade = i.quantidade + p.quantidade,
           precisa_repor = false
      from pedido p
     where i.id = p.id
    returning i.nome, p.quantidade
  )
  select string_agg(nome || ' x' || quantidade, ', ' order by nome)
    into comprados
    from atualizados;

  if comprados is null then
    raise exception 'Informe a quantidade comprada de pelo menos um insumo.';
  end if;

  insert into movimentacoes_caixa
    (tipo, categoria, descricao, valor, forma_pagamento)
  values
    ('saida', 'compra_insumo', coalesce(observacao, comprados), valor, forma);
end;
$$;

revoke all on function comprar_insumos(jsonb, numeric, forma_pagamento, text)
  from public;
grant execute on function comprar_insumos(jsonb, numeric, forma_pagamento, text)
  to authenticated;

comment on function comprar_insumos(jsonb, numeric, forma_pagamento, text) is
  'Reabastecimento: sobe a quantidade dos insumos e lança a saída no caixa '
  'na mesma transação. Não separar as duas coisas em telas diferentes.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table insumos enable row level security;

create policy "dono opera" on insumos
  for all to authenticated using (true) with check (true);

-- Anônimo não tem política nenhuma: o que a loja tem na gaveta e o que ela
-- precisa comprar não são assunto de visitante.
