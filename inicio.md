# E&S Tech — Sistema de Gestão da Assistência

Sistema web para administrar a assistência técnica E&S Tech — celulares e computadores,
conserto e outros serviços. O núcleo é a **Ordem de Serviço (OS)**.

> **Hierarquia dos documentos.** Este arquivo é a especificação de construção: o quê,
> em que ordem, com quais tabelas. Mas quem manda no significado das palavras é o
> [`CONTEXT.md`](./CONTEXT.md), e quem manda nas decisões é a pasta
> [`docs/adr/`](./docs/adr/). Havendo conflito, ADR vence este documento.
> Ler os dois antes de implementar qualquer coisa.

---

## 1. Visão geral

A E&S Tech precisa sair do papel e do caderno e ter um painel único onde dá pra
registrar cada serviço, acompanhar o status, avisar o cliente, controlar o caixa e
saber quanto realmente lucra.

Três áreas:

- **Área administrativa (privada):** onde o dono opera tudo. Protegida por login.
- **Portal do cliente (público):** o cliente digita o código da OS e vê só o status.
- **Landing page (pública):** a cara da loja, para o link da bio do Instagram.

## 2. Objetivos e não-objetivos

### Objetivos
- Registrar e acompanhar ordens de serviço da entrada à entrega.
- Cadastro de clientes com histórico.
- Caixa com recebimento parcial (sinal), saldo em aberto e contas a receber.
- Consulta de status pelo cliente, por código não sequencial.
- Aviso ao cliente por WhatsApp com um clique.
- OS e termo de garantia em PDF, com QR de acompanhamento.
- Registro fotográfico do aparelho na entrada e na entrega.
- Cotação de peças com fornecedores, como referência de preço.

### Não-objetivos (por enquanto)
- Emissão de nota fiscal ou cupom fiscal. O modelo de dados de venda já nasce
  itemizado para suportar isso quando for a hora, mas a emissão fica fora.
- API oficial do WhatsApp. Usamos link `wa.me`.
- Multi-loja. Uma unidade só.
- App nativo. Web app responsivo, mobile-first.
- Vídeo no registro fotográfico. Inviável no plano gratuito — só foto.
- Tempo real / WebSocket. Nada no domínio exige.

## 3. Stack

Ver [ADR 0012](./docs/adr/0012-stack-next-vercel-supabase-cloudinary.md).
Restrição dura: **custo zero**.

| Camada | Tecnologia |
|---|---|
| Front e back | Next.js (App Router) + React + TypeScript, na Vercel |
| Estilo | Tailwind CSS |
| Banco | Supabase (PostgreSQL) |
| Auth e autorização | Supabase Auth + Row Level Security |
| Imagens | Cloudinary (só a URL vai para o banco) |
| PDF | biblioteca de PDF em rota de servidor |
| Notificação | link `wa.me` |

Não existe backend separado: route handlers e server actions do Next são o backend.

Princípios:
- **Mobile-first.** O dono usa no balcão, quase sempre no celular.
- **Poucos cliques.** Criar uma OS não pode ser burocrático.
- **Simples primeiro.** O sistema cresce por fases (seção 8), não tudo de uma vez.
- **Nada que muda com o negócio pode custar deploy.** Tipos de serviço, categorias,
  mensagens de WhatsApp e dados da loja são todos cadastro.

## 4. Estrutura de pastas

```
/app
  /(public)
    /                    -> landing page
    /acompanhar          -> formulário: digite o código da OS
    /acompanhar/[codigo] -> status público
  /(auth)/login
  /(admin)
    /dashboard
    /os                  -> lista de ordens de serviço
    /os/nova
    /os/[id]
    /clientes
    /clientes/[id]
    /servicos            -> cadastro de tipos de serviço e categorias
    /cotacoes            -> fornecedores, peças e cotações
    /financeiro
    /insumos
    /doadores
    /vendas              -> PDV
    /configuracoes       -> dados da loja, mensagens de WhatsApp, limpeza de fotos
  /api
    /os/[id]/pdf
/components
/lib                     -> supabase, cloudinary, formatação (moeda, telefone)
/types
/supabase                -> migrations
```

## 5. Modelo de dados

PostgreSQL, nomes em português, `snake_case`. Todas as tabelas com
`id uuid primary key default gen_random_uuid()` e `criado_em timestamptz default now()`.

### clientes
| Coluna | Tipo | Notas |
|---|---|---|
| nome | text | **único campo obrigatório** |
| telefone | text | só dígitos, para o link do WhatsApp |
| email | text | opcional |
| cpf | text | opcional |
| observacoes | text | opcional |

> Sem constraint única em CPF, telefone ou email — ver
> [ADR 0004](./docs/adr/0004-cliente-sem-chave-unica-de-negocio.md).
> Duplicata se evita com busca boa, não com campo obrigatório.

### tipos_servico
| Coluna | Tipo | Notas |
|---|---|---|
| nome | text | ex.: Troca de tela |
| categoria | text | celular, computador… — organiza a landing |
| garantia_dias_padrao | int | conserto 90, formatação 0 |
| valor_padrao | numeric(10,2) | ponto de partida, editável na OS |
| ativo | boolean | default true |

> Cadastro, não enum — ver [ADR 0008](./docs/adr/0008-tipo-de-servico-e-cadastro-nao-enum.md).

### ordens_servico
| Coluna | Tipo | Notas |
|---|---|---|
| numero | serial | sequencial legível, **uso interno** |
| codigo_publico | text | curto, não sequencial, único — é o do portal e do QR |
| cliente_id | uuid | FK → clientes |
| aparelho_tipo | text | **opcional** — celular, notebook, desktop, tablet, outro |
| aparelho_marca | text | opcional |
| aparelho_modelo | text | opcional |
| aparelho_identificador | text | opcional — IMEI ou número de série |
| senha_aparelho | text | **sensível** |
| solicitacao | text | o que o cliente pediu, nas palavras dele |
| diagnostico | text | opcional |
| servico_realizado | text | opcional |
| status | text (enum) | ver seção 6 |
| valor_peca | numeric(10,2) | o que se **cobra** do cliente |
| custo_peca | numeric(10,2) | **interno** — o que se pagou. Nunca sai para o cliente |
| valor_mao_obra | numeric(10,2) | derivado: soma de `os_servicos.valor` |
| valor_total | numeric(10,2) | `valor_peca + valor_mao_obra` |
| motivo_cancelamento | text | preenchido ao cancelar |
| os_origem_id | uuid | FK → ordens_servico, quando é retorno de garantia |
| data_entrada | timestamptz | default now() |
| data_conclusao | timestamptz | gravada ao entrar em `pronto` |
| data_entrega | timestamptz | gravada ao entrar em `entregue` — a garantia conta daqui |
| atualizado_em | timestamptz | |

> **Não existe** `garantia_dias` aqui (fica em `os_servicos`, [ADR 0011](./docs/adr/0011-os-tem-varios-servicos.md))
> nem `pago`/`valor_pago` (saldo é calculado, [ADR 0002](./docs/adr/0002-pagamento-via-movimentacoes-caixa.md)).

### os_servicos
| Coluna | Tipo | Notas |
|---|---|---|
| ordem_servico_id | uuid | FK → ordens_servico |
| tipo_servico_id | uuid | FK → tipos_servico |
| valor | numeric(10,2) | copiado do `valor_padrao`, editável |
| garantia_dias | int | copiado do padrão do tipo, editável |

### os_fotos
| Coluna | Tipo | Notas |
|---|---|---|
| ordem_servico_id | uuid | FK → ordens_servico |
| url | text | Cloudinary |
| momento | text (enum) | `entrada` \| `entrega` |

> Comprimir no navegador antes de subir (1280px, JPEG ~75%). Não é otimização:
> sem isso o plano gratuito acaba em poucas dezenas de OS.

### movimentacoes_caixa
| Coluna | Tipo | Notas |
|---|---|---|
| tipo | text (enum) | `entrada` \| `saida` |
| categoria | text | servico, venda, compra_peca, compra_insumo, estorno, despesa |
| descricao | text | |
| valor | numeric(10,2) | sempre positivo; o `tipo` define o sinal |
| forma_pagamento | text (enum) | `dinheiro` \| `pix` \| `cartao` \| `outro` |
| ordem_servico_id | uuid | FK opcional |
| venda_id | uuid | FK opcional |
| data | timestamptz | default now() |

> É o **único** registro de dinheiro do sistema. Sinal, parcial e quitação são
> linhas daqui. Saldo da OS = `valor_total` − soma das entradas vinculadas.

### vendas / venda_itens
`vendas`: `cliente_id` (opcional), `valor_total`, `forma_pagamento`, `data`.
`venda_itens`: `venda_id`, `insumo_id`, `quantidade`, `valor_unitario`.

> Venda de balcão nunca é OS — ver [ADR 0005](./docs/adr/0005-venda-avulsa-separada-da-os.md).
> É o **único** lugar que baixa estoque de insumo.

### insumos
`nome`, `quantidade` (editada à mão), `custo`, `preco_venda`, `precisa_repor` (boolean).

> É lista de compras, não controle de estoque — ver
> [ADR 0006](./docs/adr/0006-insumo-e-lista-de-compras-nao-controle-de-estoque.md).
> Nenhum consumo em OS desconta quantidade.

### aparelhos_doadores
`tipo`, `marca`, `modelo`, `condicao`, `observacoes` (texto livre: "tela já foi, bateria boa").

> Não tem quantidade: cada aparelho é um registro com estado próprio de canibalização.

### fornecedores / pecas / qualidades / cotacoes
`fornecedores`: `nome`, `telefone`, `observacoes`.
`pecas`: `nome`, `modelo_compativel` — catálogo de referência, criado na hora de cotar.
`qualidades`: `nome` — Incell, OLED, Soft OLED. Cadastro editável.
`cotacoes`: `fornecedor_id`, `peca_id`, `qualidade_id`, `preco`, `data`.

> **Append-only**: cotação nova nunca sobrescreve a antiga. E **não se conecta à OS** —
> ver [ADR 0010](./docs/adr/0010-cotacao-e-consulta-nao-transacao.md).

### modelos_mensagem
`situacao` (pronto, orcamento, cobranca…), `texto` com variáveis `{cliente}`, `{numero}`, `{valor}`.

### dados_loja
Registro único: `nome`, `endereco`, `horario`, `telefone`, `logo_url`, `margem_padrao`.
Alimenta a landing, o PDF e as mensagens de WhatsApp.

## 6. Fluxo de status da OS

```
aguardando_analise → em_analise → orcamento_enviado → aprovado
      → em_conserto → pronto → entregue
```

- De `orcamento_enviado`, o cliente pode não aprovar → `recusado`.
- De qualquer status ativo → `cancelado` (aparelho irreparável, desistência,
  qualquer coisa que não seja rejeição de orçamento). Exige `motivo_cancelamento`,
  e abre a opção de registrar estorno.

Enum: `aguardando_analise`, `em_analise`, `orcamento_enviado`, `aprovado`,
`em_conserto`, `pronto`, `entregue`, `recusado`, `cancelado`.

Regras:
- Ao entrar em `pronto`, gravar `data_conclusao`.
- Ao entrar em `entregue`, gravar `data_entrega`. A garantia conta daqui.
- Entregar com saldo em aberto **é permitido**, com aviso claro do valor devido.
- Cada mudança de status pode disparar o aviso de WhatsApp.

Orçamento é **estado**, não entidade separada — ver
[ADR 0009](./docs/adr/0009-orcamento-e-estado-da-os.md).

## 7. Módulos

**Ordem de serviço (núcleo).** Criar escolhendo/cadastrando cliente na hora; vários
serviços por OS; aparelho opcional; fotos de entrada e entrega; mudança de status;
botão de WhatsApp; PDF; filtro da lista por status e por "entregue com saldo em aberto".

**Clientes.** CRUD e histórico de OS. Busca casando nome parcial, telefone e CPF.

**Serviços.** Cadastro de tipos de serviço e categorias, com garantia e valor padrão.

**Cotações.** Fornecedores, peças e qualidades. Tela de cotação em massa: escolhe a
peça uma vez e preenche uma grade fornecedor × qualidade × preço de uma vez só —
se for um formulário por linha, o módulo morre de desuso. Consulta mostra o último
preço por trio, com a data.

**Financeiro.** Entradas e saídas, sinal e parcial, estorno. Relatórios: faturamento
do mês (OS + vendas), saídas, lucro por OS e por tipo de serviço. Bloco "A receber"
no dashboard.

**Insumos.** Cadastro, marcação de reposição, lista de compras e registro de compra
(sobe quantidade e lança a saída no caixa **na mesma tela**).

**Aparelhos doadores.** Cadastro com busca por modelo.

**Vendas (PDV).** Venda de balcão itemizada, gerando a movimentação de caixa.

**Garantia.** Prazo por serviço, contado da entrega. Lista do que está na garantia.
Retorno abre OS nova ligada à original — ver
[ADR 0003](./docs/adr/0003-retorno-de-garantia-e-os-nova.md).

**Portal do cliente.** `/acompanhar/[codigo]`: **apenas** status, tipo de serviço e
linha do tempo. Marca/modelo só se existirem.

**Landing page.** Uma página, mobile-first. Botões de categoria trocam só o bloco de
serviços — WhatsApp, endereço e consulta de OS ficam sempre visíveis. WhatsApp com
mensagem pré-preenchida por categoria. **Sem preço.**

**Dashboard.** OS por status, faturamento do mês, a receber, dias parados em `pronto`.

**Configurações.** Dados da loja, modelos de mensagem, limpeza de fotos, exportação CSV.

## 8. Roadmap por fases

Construir **em ordem**.

### Fase 1 — usar no primeiro cliente
- [ ] Auth (um usuário admin)
- [ ] Dados da loja
- [ ] CRUD de clientes com busca
- [ ] Cadastro de tipos de serviço e categorias
- [ ] OS com vários serviços, status e solicitação
- [ ] Lista de OS com filtro por status
- [ ] Caixa com pagamento parcial e formas de pagamento
- [ ] Dashboard: OS por status, faturamento do mês, a receber
- [ ] Exportação CSV (OS, clientes, caixa) — é o backup

### Fase 2 — profissionalização
- [ ] Registro fotográfico (entrada e entrega), com compressão
- [ ] Cotações: fornecedores, peças, qualidades
- [ ] WhatsApp com modelos de mensagem editáveis
- [ ] PDF da OS e do termo de garantia, com QR
- [ ] Portal público de acompanhamento
- [ ] Landing page

### Fase 3 — escala
- [ ] Venda avulsa / PDV
- [ ] Insumos e lista de compras
- [ ] Aparelhos doadores
- [ ] Relatório de lucro por OS e por tipo de serviço
- [ ] Múltiplos usuários com permissões
- [ ] Tela de limpeza de fotos com uso de espaço

## 9. Regras de negócio

- `valor_total = valor_peca + valor_mao_obra`, e `valor_mao_obra` é a soma dos serviços.
- Saldo da OS = `valor_total` − soma das entradas de caixa vinculadas. Nunca armazenado.
- Garantia conta da `data_entrega`, por serviço.
- Entregar com saldo em aberto é permitido, com aviso.
- Cancelar exige motivo e oferece registrar estorno; quanto devolver é decisão humana.
- Insumo só baixa em venda avulsa. Nunca em OS.
- Cotação é referência: não vira valor de OS automaticamente.
- Não impedir a criação de OS por falta de peça ou insumo.

## 10. Requisitos não-funcionais

- **Mobile-first.** Testar tudo primeiro no celular.
- **Segurança do portal público.** Row Level Security no banco **e** uma função
  dedicada que monta o objeto público campo a campo. A rota pública nunca consulta a
  tabela direto, e nunca espalha o registro inteiro (`{...os}`) — a OS carrega senha do
  aparelho, custo de peça e valores no mesmo registro que o status.
- **Dados sensíveis.** `senha_aparelho` e `custo_peca` só na área privada. Nunca no
  portal, nunca em PDF entregue ao cliente, nunca em log.
- **LGPD.** Nome, telefone e CPF são dados pessoais; fotos de aparelho capturam dado
  pessoal sem querer. Coletar só o necessário, e ter como apagar as fotos.
- **Custo zero.** Comprimir imagem antes do upload é requisito, não otimização.
  O plano gratuito do Supabase pausa após 7 dias sem uso — uso diário resolve.
- **Performance.** Paginação nas listas e índices por `status`, `cliente_id` e
  `codigo_publico`.

## 11. Setup inicial

1. Criar projeto no Supabase; anotar URL e chaves.
2. Criar conta no Cloudinary; anotar cloud name e preset de upload.
3. `npx create-next-app` (TypeScript + Tailwind + App Router).
4. Variáveis de ambiente:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=       # só no servidor, nunca no client
   CLOUDINARY_URL=                  # só no servidor
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
   ```
5. Rodar as migrations (seção 5) e configurar as políticas de RLS.
6. Criar o usuário admin no Supabase Auth.
7. `npm run dev`, começar pela Fase 1.
8. Deploy na Vercel conectando o repositório.

## 12. Instruções para o agente de código

- **Ler `CONTEXT.md` e `docs/adr/` antes deste arquivo.** Este é o plano de
  construção; aqueles são a autoridade sobre significado e decisão.
- Usar os termos do `CONTEXT.md` no código, em português: `solicitacao` e não
  `defeito`, `cotacao` e não `orcamento`, `insumo` e não `peca` quando for consumível.
- Seguir o roadmap **em ordem**. Fase 1 funcionando antes de tocar na Fase 2.
- Priorizar o fluxo "criar OS" ponta a ponta antes de qualquer refinamento visual.
- Nunca expor `senha_aparelho`, `custo_peca` ou valores no portal público.
- Componentes pequenos; formatação de moeda e telefone centralizada em `/lib`.
- Ao encontrar contradição entre este documento e um ADR, **o ADR vence** — e avisar,
  porque significa que este arquivo ficou desatualizado de novo.
