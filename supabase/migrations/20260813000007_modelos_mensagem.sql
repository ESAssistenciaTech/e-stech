-- Modelos de mensagem para o aviso no WhatsApp.
--
-- Cadastro, não texto no código: ajustar o tom de uma mensagem não pode
-- custar deploy. Mesmo raciocínio do ADR 0008 aplicado ao que a loja fala.

create table modelos_mensagem (
  id uuid primary key default gen_random_uuid(),
  -- Momento da conversa, não status da OS: "cobranca" não é status nenhum,
  -- e "entrada" serve para qualquer OS recém-aberta.
  situacao text not null unique,
  texto text not null,
  atualizado_em timestamptz not null default now(),
  criado_em timestamptz not null default now()
);

create trigger modelos_mensagem_atualizado_em
  before update on modelos_mensagem
  for each row execute function set_atualizado_em();

alter table modelos_mensagem enable row level security;
create policy "dono opera" on modelos_mensagem
  for all to authenticated using (true) with check (true);

-- O texto inicial usa as variáveis para o dono ver como funcionam, e o
-- {link} aparece na entrada de propósito: é o que faz o portal existir na
-- cabeça do cliente antes de ele precisar dele.
insert into modelos_mensagem (situacao, texto) values
  (
    'entrada',
    'Oi {cliente}, aqui é da {loja}. Recebemos seu {aparelho} e a ordem de serviço é a {codigo}. Você pode acompanhar por aqui a qualquer hora: {link}'
  ),
  (
    'orcamento',
    'Oi {cliente}, terminamos a análise do seu {aparelho}. O orçamento ficou em {valor}. Pode confirmar se seguimos com o serviço?'
  ),
  (
    'pronto',
    'Oi {cliente}, seu {aparelho} está pronto e já pode ser retirado. Ordem {codigo}.'
  ),
  (
    'cobranca',
    'Oi {cliente}, tudo bem? Passando pra lembrar do saldo de {saldo} da ordem {codigo}. Qualquer dúvida é só chamar.'
  );
