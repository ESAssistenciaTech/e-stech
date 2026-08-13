-- Cotação de peça com fornecedor.
--
-- Serve para uma frase só, dita no balcão com o cliente na frente: "na
-- última vez que perguntei, a OLED estava R$600". Por isso a data é parte
-- do dado, e por isso cotação nova NÃO sobrescreve a antiga.
--
-- Não se conecta à OS. Ver ADR 0010.

create table fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  observacoes text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Catálogo de referência, não estoque: a loja normalmente NÃO tem a peça,
-- só sabe onde conseguir. Cadastrada na hora de cotar.
create table pecas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  modelo_compativel text,
  criado_em timestamptz not null default now()
);

create index pecas_nome_idx on pecas (lower(nome));

-- Mesmo modelo de peça em níveis diferentes. É cadastro porque o mercado
-- inventa nome novo com frequência.
create table qualidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem int not null default 0,
  ativa boolean not null default true
);

insert into qualidades (nome, ordem) values
  ('Original', 1),
  ('Incell', 2),
  ('OLED', 3),
  ('Soft OLED', 4),
  ('Genérica', 5);

create table cotacoes (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references fornecedores (id) on delete cascade,
  peca_id uuid not null references pecas (id) on delete cascade,
  qualidade_id uuid not null references qualidades (id) on delete restrict,
  preco numeric(10, 2) not null check (preco > 0),
  data timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

-- Empilha, nunca sobrescreve: além de responder "quanto está hoje", mostra
-- de graça o fornecedor que subiu 40% em três meses.
create index cotacoes_busca_idx
  on cotacoes (peca_id, qualidade_id, fornecedor_id, data desc);

-- A consulta do balcão: o preço mais recente de cada trio.
create view ultimas_cotacoes with (security_invoker = on) as
select distinct on (c.peca_id, c.qualidade_id, c.fornecedor_id)
  c.id,
  c.peca_id,
  c.qualidade_id,
  c.fornecedor_id,
  c.preco,
  c.data,
  p.nome as peca_nome,
  p.modelo_compativel,
  q.nome as qualidade_nome,
  q.ordem as qualidade_ordem,
  f.nome as fornecedor_nome,
  f.telefone as fornecedor_telefone
from cotacoes c
join pecas p on p.id = c.peca_id
join qualidades q on q.id = c.qualidade_id
join fornecedores f on f.id = c.fornecedor_id
where f.ativo
order by c.peca_id, c.qualidade_id, c.fornecedor_id, c.data desc;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

-- Preço de fornecedor é custo da loja. Nada disto é público, e o portal
-- não tem nenhum motivo para alcançar estas tabelas.
alter table fornecedores enable row level security;
alter table pecas enable row level security;
alter table qualidades enable row level security;
alter table cotacoes enable row level security;

create policy "dono opera" on fornecedores
  for all to authenticated using (true) with check (true);
create policy "dono opera" on pecas
  for all to authenticated using (true) with check (true);
create policy "dono opera" on qualidades
  for all to authenticated using (true) with check (true);
create policy "dono opera" on cotacoes
  for all to authenticated using (true) with check (true);
