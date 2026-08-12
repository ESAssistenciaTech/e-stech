-- Fase 1 do sistema E&S Tech.
-- Ver CONTEXT.md (glossário) e docs/adr/ (decisões). Onde este arquivo
-- contradisser um ADR, o ADR vence.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type status_os as enum (
  'aguardando_analise',
  'em_analise',
  'orcamento_enviado',
  'aprovado',
  'em_conserto',
  'pronto',
  'entregue',
  'recusado',
  'cancelado'
);

create type tipo_movimentacao as enum ('entrada', 'saida');

create type forma_pagamento as enum ('dinheiro', 'pix', 'cartao', 'outro');

create type tipo_aparelho as enum (
  'celular',
  'notebook',
  'desktop',
  'tablet',
  'outro'
);

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- Código público da OS: curto e não sequencial, para o portal e o QR.
-- Alfabeto sem caracteres que se confundem ditados por telefone
-- (sem I, L, O, 0, 1). 31^6 = ~887 milhões de combinações.
create or replace function gerar_codigo_publico()
returns text
language plpgsql
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  codigo text;
  i int;
begin
  loop
    codigo := '';
    for i in 1..6 loop
      codigo := codigo || substr(alfabeto, floor(random() * length(alfabeto) + 1)::int, 1);
    end loop;
    exit when not exists (
      select 1 from ordens_servico where codigo_publico = codigo
    );
  end loop;
  return codigo;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dados da loja (registro único)
-- ---------------------------------------------------------------------------

create table dados_loja (
  -- Garante uma linha só: a chave primária só aceita o valor true.
  singleton boolean primary key default true check (singleton),
  nome text not null default 'E&S Tech',
  endereco text,
  horario text,
  telefone text,
  logo_url text,
  margem_padrao numeric(5, 2) not null default 30,
  atualizado_em timestamptz not null default now()
);

create trigger dados_loja_atualizado_em
  before update on dados_loja
  for each row execute function set_atualizado_em();

insert into dados_loja (singleton) values (true);

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------

-- Sem chave única de negócio: nem CPF, nem telefone, nem email.
-- Ver ADR 0004 — duplicata se evita com busca boa, não com campo obrigatório.
-- Não adicionar constraint única aqui depois.
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  cpf text,
  observacoes text,
  criado_em timestamptz not null default now()
);

-- Busca casando nome parcial, telefone e CPF ao mesmo tempo.
create index clientes_busca_idx on clientes
  using gin (
    to_tsvector(
      'portuguese',
      coalesce(nome, '') || ' ' || coalesce(telefone, '') || ' ' || coalesce(cpf, '')
    )
  );

-- ---------------------------------------------------------------------------
-- Tipos de serviço
-- ---------------------------------------------------------------------------

-- Cadastro, não enum — ver ADR 0008. A lista de serviços de uma assistência
-- é grande e não é conhecida de antemão; serviço novo não pode custar deploy.
create table tipos_servico (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null default 'celular',
  garantia_dias_padrao int not null default 90,
  valor_padrao numeric(10, 2) not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create index tipos_servico_categoria_idx on tipos_servico (categoria) where ativo;

-- ---------------------------------------------------------------------------
-- Ordens de serviço
-- ---------------------------------------------------------------------------

create table ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero serial not null unique,
  codigo_publico text not null unique default gerar_codigo_publico(),
  cliente_id uuid not null references clientes (id) on delete restrict,

  -- Aparelho é atributo, não âncora: existe OS sem aparelho nenhum
  -- (suporte remoto, atendimento em domicílio). Ver ADR 0007.
  aparelho_tipo tipo_aparelho,
  aparelho_marca text,
  aparelho_modelo text,
  aparelho_identificador text,

  -- Sensível: só na área privada. Nunca em portal, PDF ou log.
  senha_aparelho text,

  -- "Quero formatar" não é defeito. Ver ADR 0007.
  solicitacao text not null,
  diagnostico text,
  servico_realizado text,

  status status_os not null default 'aguardando_analise',

  -- valor_peca é o que se cobra; custo_peca é o que se pagou.
  -- custo_peca é INTERNO: sem ele o sistema mostra faturamento, não lucro.
  valor_peca numeric(10, 2) not null default 0,
  custo_peca numeric(10, 2) not null default 0,

  motivo_cancelamento text,
  os_origem_id uuid references ordens_servico (id) on delete set null,

  data_entrada timestamptz not null default now(),
  data_conclusao timestamptz,
  data_entrega timestamptz,
  atualizado_em timestamptz not null default now(),

  -- Cancelar exige dizer por quê.
  constraint cancelamento_tem_motivo check (
    status <> 'cancelado' or motivo_cancelamento is not null
  )
);

-- Não existe garantia_dias aqui (fica em os_servicos, ADR 0011),
-- nem pago/valor_pago (saldo é calculado, ADR 0002).

create index ordens_servico_status_idx on ordens_servico (status);
create index ordens_servico_cliente_idx on ordens_servico (cliente_id);
create index ordens_servico_entrada_idx on ordens_servico (data_entrada desc);

create trigger ordens_servico_atualizado_em
  before update on ordens_servico
  for each row execute function set_atualizado_em();

-- Datas que o status implica. Gravar à mão em toda tela seria esquecer
-- em alguma delas.
create or replace function marcar_datas_por_status()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'pronto' and old.status <> 'pronto' and new.data_conclusao is null then
    new.data_conclusao = now();
  end if;
  if new.status = 'entregue' and old.status <> 'entregue' and new.data_entrega is null then
    new.data_entrega = now();
  end if;
  return new;
end;
$$;

create trigger ordens_servico_datas
  before update on ordens_servico
  for each row execute function marcar_datas_por_status();

-- ---------------------------------------------------------------------------
-- Serviços da OS
-- ---------------------------------------------------------------------------

-- Uma OS tem vários — ver ADR 0011. Trocar a tela (90 dias) e formatar
-- (nenhuma) o mesmo notebook são coberturas diferentes, e um prazo único
-- na OS não teria como expressar as duas.
create table os_servicos (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references ordens_servico (id) on delete cascade,
  tipo_servico_id uuid not null references tipos_servico (id) on delete restrict,
  valor numeric(10, 2) not null default 0,
  garantia_dias int not null default 0,
  criado_em timestamptz not null default now()
);

create index os_servicos_os_idx on os_servicos (ordem_servico_id);

-- ---------------------------------------------------------------------------
-- Movimentações de caixa
-- ---------------------------------------------------------------------------

-- Único registro de dinheiro do sistema. Sinal, parcial e quitação são
-- linhas daqui — ver ADR 0002. Não criar tabela de pagamentos nem coluna
-- "pago" na OS: o saldo é sempre calculado.
create table movimentacoes_caixa (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_movimentacao not null,
  categoria text not null,
  descricao text,
  valor numeric(10, 2) not null check (valor > 0),
  forma_pagamento forma_pagamento not null default 'dinheiro',
  ordem_servico_id uuid references ordens_servico (id) on delete set null,
  data timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create index movimentacoes_caixa_data_idx on movimentacoes_caixa (data desc);
create index movimentacoes_caixa_os_idx on movimentacoes_caixa (ordem_servico_id);

-- ---------------------------------------------------------------------------
-- Totais da OS
-- ---------------------------------------------------------------------------

-- Nenhum destes valores é armazenado. Guardar total e saldo em coluna é
-- criar duas fontes para o mesmo número, que uma hora divergem — mesmo
-- raciocínio do ADR 0002.
-- security_invoker = on é obrigatório: sem isso a view roda com privilégio
-- do dono e ignora o RLS das tabelas de baixo.
create view ordens_servico_totais with (security_invoker = on) as
select
  os.id,
  coalesce(serv.valor_mao_obra, 0) as valor_mao_obra,
  os.valor_peca + coalesce(serv.valor_mao_obra, 0) as valor_total,
  coalesce(pago.valor_pago, 0) as valor_pago,
  os.valor_peca + coalesce(serv.valor_mao_obra, 0) - coalesce(pago.valor_pago, 0) as saldo,
  os.valor_peca + coalesce(serv.valor_mao_obra, 0) - os.custo_peca as lucro
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
-- Row Level Security
-- ---------------------------------------------------------------------------

-- A chave publicável vai no bundle do navegador e é legível por qualquer
-- visitante. Quem protege os dados é isto aqui, não o segredo da chave.

alter table dados_loja enable row level security;
alter table clientes enable row level security;
alter table tipos_servico enable row level security;
alter table ordens_servico enable row level security;
alter table os_servicos enable row level security;
alter table movimentacoes_caixa enable row level security;

-- Fase 1 tem um usuário só: o dono. Quem está autenticado opera tudo.
-- Permissão por papel entra na Fase 3, quando houver técnicos.
create policy "dono opera" on dados_loja
  for all to authenticated using (true) with check (true);
create policy "dono opera" on clientes
  for all to authenticated using (true) with check (true);
create policy "dono opera" on tipos_servico
  for all to authenticated using (true) with check (true);
create policy "dono opera" on ordens_servico
  for all to authenticated using (true) with check (true);
create policy "dono opera" on os_servicos
  for all to authenticated using (true) with check (true);
create policy "dono opera" on movimentacoes_caixa
  for all to authenticated using (true) with check (true);

-- Visitante anônimo não tem política nenhuma, então não lê nada.
-- O portal público (Fase 2) NÃO deve ganhar uma política de leitura aqui:
-- a OS carrega senha do aparelho, custo de peça e valores na mesma linha
-- que o status. O acesso público vem por função dedicada que monta o
-- objeto campo a campo. Ver ADR 0012.

-- ---------------------------------------------------------------------------
-- Dados iniciais
-- ---------------------------------------------------------------------------

insert into tipos_servico (nome, categoria, garantia_dias_padrao, valor_padrao) values
  ('Troca de tela',      'celular',    90,  0),
  ('Troca de bateria',   'celular',    90,  0),
  ('Limpeza',            'celular',    30,  0),
  ('Formatação',         'computador',  0,  0),
  ('Instalação de peça', 'computador', 90,  0),
  ('Limpeza interna',    'computador', 30,  0);
