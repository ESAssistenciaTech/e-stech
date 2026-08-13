-- Registro fotográfico do aparelho.
--
-- Serve para encerrar discussão sobre estado: "chegou riscado" na entrada,
-- "saiu quebrado daí" na entrega. É registro da loja, sem assinatura nem
-- confirmação do cliente.

create type momento_foto as enum ('entrada', 'entrega');

create table os_fotos (
  id uuid primary key default gen_random_uuid(),
  ordem_servico_id uuid not null references ordens_servico (id) on delete cascade,
  momento momento_foto not null,
  url text not null,
  -- Necessário para apagar do Cloudinary depois. Sem ele, apagar a linha
  -- aqui deixaria o arquivo ocupando espaço lá para sempre.
  public_id text not null,
  largura int,
  altura int,
  criado_em timestamptz not null default now()
);

create index os_fotos_os_idx on os_fotos (ordem_servico_id, momento);

alter table os_fotos enable row level security;
create policy "dono opera" on os_fotos
  for all to authenticated using (true) with check (true);

-- Anônimo não tem policy: foto de aparelho captura dado pessoal sem querer
-- — tela de bloqueio, papel na bancada, adesivo com nome. O portal público
-- não mostra foto, e não é para mostrar.
