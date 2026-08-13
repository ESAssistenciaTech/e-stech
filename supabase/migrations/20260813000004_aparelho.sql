-- Ajustes no registro do aparelho, vindos do uso real no balcão.

-- ---------------------------------------------------------------------------
-- Marcas
-- ---------------------------------------------------------------------------

-- Lista fixa e curada, porque marca é conjunto pequeno e estável. Modelo NÃO
-- vira cadastro: sai por sugestão do que já foi digitado naquela marca, senão
-- manter catálogo de modelo vira trabalho mensal para sempre.
create table marcas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  -- Em quais tipos de aparelho essa marca aparece. Evita oferecer Dell para
  -- celular e Motorola para desktop.
  tipos tipo_aparelho[] not null default '{}',
  ativa boolean not null default true,
  criado_em timestamptz not null default now()
);

alter table marcas enable row level security;
create policy "dono opera" on marcas
  for all to authenticated using (true) with check (true);

insert into marcas (nome, tipos) values
  ('Apple',     '{celular,tablet,notebook,desktop}'),
  ('Samsung',   '{celular,tablet,notebook}'),
  ('Xiaomi',    '{celular,tablet}'),
  ('Motorola',  '{celular}'),
  ('Realme',    '{celular}'),
  ('Asus',      '{celular,notebook,desktop}'),
  ('LG',        '{celular,notebook}'),
  ('Nokia',     '{celular}'),
  ('Infinix',   '{celular}'),
  ('TCL',       '{celular,tablet}'),
  ('Positivo',  '{celular,tablet,notebook,desktop}'),
  ('Multilaser','{celular,tablet,notebook}'),
  ('Lenovo',    '{tablet,notebook,desktop}'),
  ('Acer',      '{notebook,desktop}'),
  ('Dell',      '{notebook,desktop}'),
  ('HP',        '{notebook,desktop}'),
  ('Vaio',      '{notebook}'),
  ('Compaq',    '{notebook,desktop}');

-- ---------------------------------------------------------------------------
-- Senha do aparelho
-- ---------------------------------------------------------------------------

-- Anotar tudo num campo de texto só perde a informação de COMO desbloquear.
-- "1236" é PIN ou desenho? São gestos diferentes na tela.
create type tipo_senha as enum ('pin', 'padrao', 'senha', 'sem_senha');

alter table ordens_servico
  add column senha_tipo tipo_senha;

-- ---------------------------------------------------------------------------
-- Aparelho que não dá para identificar
-- ---------------------------------------------------------------------------

-- Celular que não liga ou com a tela destruída não tem como ter o IMEI
-- verificado, e às vezes nem o dono sabe o modelo. Campo vazio não diz se
-- foi esquecimento ou impossibilidade — e essa diferença é justamente o que
-- protege a loja quando o cliente questiona depois.
alter table ordens_servico
  add column marca_nao_identificada boolean not null default false,
  add column modelo_nao_identificado boolean not null default false,
  add column identificador_nao_identificado boolean not null default false;

-- Sugestão de modelo por marca, para a abertura de OS. Cresce sozinha com o
-- uso: o que foi digitado uma vez vira opção na próxima.
create index ordens_servico_marca_modelo_idx
  on ordens_servico (aparelho_marca, aparelho_modelo)
  where aparelho_marca is not null and aparelho_modelo is not null;
