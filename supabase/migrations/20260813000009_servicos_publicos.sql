-- Serviços para a landing page.
--
-- tipos_servico guarda valor_padrao, e a decisão foi não mostrar preço na
-- página pública: tela de celular depende de modelo e qualidade, e número
-- fixo ali vira promessa que a loja não controla, já que quem define é o
-- fornecedor.
--
-- Como RLS não filtra coluna, o preço sairia junto numa policy de leitura.
-- Função devolvendo só nome e categoria.

create or replace function servicos_publicos()
returns table (nome text, categoria text)
language sql
security definer
set search_path = public
stable
as $$
  select t.nome, t.categoria
  from tipos_servico t
  where t.ativo
  order by t.categoria, t.nome;
$$;

revoke all on function servicos_publicos() from public;
grant execute on function servicos_publicos() to anon, authenticated;

comment on function servicos_publicos() is
  'Serviços para a landing. NUNCA incluir valor_padrao no retorno — a '
  'decisão de não publicar preço é de negócio, não de layout.';
