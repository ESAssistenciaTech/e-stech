-- Aparelhos doadores. Ver CONTEXT.md.
--
-- Aparelho físico guardado para ter peça arrancada conforme a necessidade.
--
-- NÃO tem coluna de quantidade, e não é para ganhar uma: dois aparelhos do
-- mesmo modelo são dois registros, porque cada um está num estado diferente
-- de canibalização — de um já saiu a tela, do outro só a bateria. Agrupar por
-- modelo com um contador perderia exatamente a informação que importa na hora
-- de ir na gaveta.
--
-- Também não é estoque de peças: o que já foi arrancado vive em anotação
-- livre, não em lista de itens. A pergunta que se faz aqui é "tenho um desse
-- modelo?", e a resposta é um aparelho, não um número.

create table aparelhos_doadores (
  id uuid primary key default gen_random_uuid(),

  -- O modelo é a identidade: é por ele que se procura.
  modelo text not null,
  marca text,
  tipo tipo_aparelho,

  -- IMEI ou número de série, quando dá para ler. Aparelho que não liga
  -- normalmente não dá.
  identificador text,

  -- O estado da canibalização, em texto: "tela já saiu, placa boa, sem
  -- bateria". Campo livre porque a variedade do que se arranca não cabe em
  -- lista, e manter a lista atualizada é trabalho que ninguém faz.
  anotacoes text,

  -- Terminal: já não sobrou nada que preste. Some da busca sem apagar o
  -- histórico de que o aparelho existiu.
  esgotado boolean not null default false,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index aparelhos_doadores_modelo_idx
  on aparelhos_doadores (modelo) where not esgotado;

create trigger aparelhos_doadores_atualizado_em
  before update on aparelhos_doadores
  for each row execute function set_atualizado_em();

alter table aparelhos_doadores enable row level security;

create policy "dono opera" on aparelhos_doadores
  for all to authenticated using (true) with check (true);

-- Anônimo não tem política: o identificador de um aparelho guardado é dado
-- de aparelho de terceiro, e a gaveta da loja não é assunto de visitante.
