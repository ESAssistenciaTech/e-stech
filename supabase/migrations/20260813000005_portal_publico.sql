-- Consulta pública de OS pelo código.
--
-- A tabela ordens_servico NÃO ganha policy de leitura anônima, e não é pra
-- ganhar: a mesma linha carrega senha do aparelho, custo de peça, valores e
-- dados do cliente junto do status. Uma policy ali significaria confiar que
-- toda consulta futura vai lembrar de filtrar coluna — e uma hora não lembra.
--
-- No lugar disso, esta função monta o objeto público campo a campo. O que
-- não está escrito aqui não sai. Ver ADR 0012.

create or replace function consultar_os(codigo text)
returns table (
  codigo_publico text,
  status status_os,
  aparelho text,
  servicos text[],
  data_entrada timestamptz,
  data_conclusao timestamptz,
  data_entrega timestamptz
)
language sql
security definer
-- Obrigatório em security definer: sem fixar o search_path, dá para
-- sequestrar a função criando objetos de mesmo nome em outro schema.
set search_path = public
stable
as $$
  select
    os.codigo_publico,
    os.status,
    nullif(
      trim(
        coalesce(
          case when os.marca_nao_identificada then '' else os.aparelho_marca end,
          ''
        ) || ' ' ||
        coalesce(
          case when os.modelo_nao_identificado then '' else os.aparelho_modelo end,
          ''
        )
      ),
      ''
    ) as aparelho,
    coalesce(
      (
        select array_agg(ts.nome order by osv.criado_em)
        from os_servicos osv
        join tipos_servico ts on ts.id = osv.tipo_servico_id
        where osv.ordem_servico_id = os.id
      ),
      '{}'
    ) as servicos,
    os.data_entrada,
    os.data_conclusao,
    os.data_entrega
  from ordens_servico os
  -- Normaliza o que o cliente digita: hífen, espaço e minúscula.
  where os.codigo_publico = upper(regexp_replace(codigo, '[^a-zA-Z0-9]', '', 'g'))
  limit 1;
$$;

-- Ninguém executa por herança: só quem for nomeado abaixo.
revoke all on function consultar_os(text) from public;
grant execute on function consultar_os(text) to anon, authenticated;

comment on function consultar_os(text) is
  'Consulta pública de OS pelo código. Devolve apenas status, aparelho, '
  'serviços e datas. NUNCA adicionar valor, custo, senha ou dado de cliente '
  'ao retorno — é a única porta de entrada anônima do sistema.';
