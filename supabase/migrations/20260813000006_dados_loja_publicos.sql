-- Dados da loja para as telas públicas.
--
-- O portal precisa mostrar nome, endereço, horário e telefone da loja, mas
-- a tabela dados_loja não pode ser aberta para anônimo: RLS é por linha, não
-- por coluna, e a mesma linha guarda margem_padrao — a margem que a loja
-- aplica sobre o preço do fornecedor. Uma policy de leitura ali entregaria
-- isso junto.
--
-- Mesma solução da consulta de OS: função que devolve só o que é público.

create or replace function dados_loja_publicos()
returns table (
  nome text,
  endereco text,
  horario text,
  telefone text,
  logo_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select d.nome, d.endereco, d.horario, d.telefone, d.logo_url
  from dados_loja d
  where d.singleton
  limit 1;
$$;

revoke all on function dados_loja_publicos() from public;
grant execute on function dados_loja_publicos() to anon, authenticated;

comment on function dados_loja_publicos() is
  'Dados da loja para as telas públicas. NUNCA incluir margem_padrao no '
  'retorno — é a margem sobre o fornecedor, e sai em página aberta.';
