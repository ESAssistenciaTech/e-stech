# E&S Tech — Sistema de Gestão da Assistência

Sistema web para administrar uma assistência técnica de celulares. O núcleo é a
**Ordem de Serviço (OS)**: todo aparelho que entra vira uma OS, e todos os outros
módulos (clientes, peças, financeiro, garantia) existem para dar suporte a ela.

Este documento é a **fonte da verdade** do projeto. Ele descreve o que será
construído, como, e em que ordem. Deve ser lido pelo agente de código antes de
qualquer implementação.

---

## 1. Visão geral

A E&S Tech precisa sair da bagunça de anotar serviço em papel/caderno e ter um
painel único onde dá pra: registrar cada conserto, acompanhar o status, avisar o
cliente, controlar o caixa e saber quanto realmente lucra por serviço.

O sistema tem duas áreas:

- **Área administrativa (privada):** onde o dono opera tudo — cria OS, muda status,
  registra pagamentos, consulta clientes. Protegida por login.
- **Portal do cliente (público):** uma página onde o cliente digita o número da OS
  e vê só o status do conserto dele. Sem login, sem dados sensíveis.

## 2. Objetivos e não-objetivos+

### Objetivos
- Registrar e acompanhar ordens de serviço do início (entrada) ao fim (entrega).
- Cadastro de clientes com histórico de aparelhos e serviços.
- Controle de caixa (entradas e saídas) e lucro por OS.
- Consulta de status pelo cliente via portal público.
- Aviso ao cliente por WhatsApp com um clique.
- Geração de OS e termo de garantia em PDF com a marca.

### Não-objetivos (por enquanto)
- Emissão de nota fiscal eletrônica (fica pro contador/MEI, fora do sistema no MVP).
- Integração com API oficial do WhatsApp (usaremos link `wa.me`, sem API paga).
- Multi-loja / franquias. O sistema é de uma unidade só.
- App nativo. É um web app responsivo (mobile-first), acessado pelo navegador.

## 3. Stack tecnológica

Escolhida para um desenvolvedor solo que já usa Vercel, priorizando velocidade de
construção e baixo custo. Se já houver uma stack de preferência em uso, adaptar.

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript |
| Estilo | Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (e-mail/senha) |
| Armazenamento | Supabase Storage (logo, PDFs gerados) |
| Geração de PDF | biblioteca de PDF em rota de servidor (ex.: `@react-pdf/renderer`) |
| Notificação | link `https://wa.me/<numero>?text=<mensagem>` |
| Hospedagem | Vercel |

Princípios:
- **Mobile-first.** O dono vai usar no balcão, muitas vezes pelo celular. Toda tela
  precisa funcionar bem em tela pequena antes de pensar no desktop.
- **Poucos cliques.** Criar uma OS não pode ser burocrático. O caminho "novo
  cliente + novo aparelho + nova OS" tem que ser rápido.
- **Simples primeiro.** Preferir soluções diretas a abstrações. O sistema cresce por
  fases (ver seção 9), não tudo de uma vez.

## 4. Estrutura de pastas sugerida

```
/app
  /(auth)/login
  /(admin)
    /dashboard
    /os            -> lista de ordens de serviço
    /os/nova       -> criar OS
    /os/[id]       -> detalhe/edição da OS
    /clientes
    /clientes/[id]
    /pecas
    /financeiro
  /(public)
    /acompanhar          -> formulário: digite o número da OS
    /acompanhar/[numero] -> status público da OS
  /api
    /os/[id]/pdf   -> gera o PDF da OS/garantia
/components        -> componentes de UI reutilizáveis
/lib               -> cliente supabase, helpers, formatação (moeda, telefone)
/types             -> tipos TypeScript do domínio
/supabase          -> migrations / schema SQL
```

## 5. Modelo de dados

Tabelas em PostgreSQL. Nomes em português (linguagem do domínio), `snake_case`.
Todas com `id uuid primary key default gen_random_uuid()` e `criado_em timestamptz
default now()`.

### clientes
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| nome | text | obrigatório |
| telefone | text | usado para o link do WhatsApp (só dígitos) |
| email | text | opcional |
| cpf | text | opcional |
| observacoes | text | opcional |
| criado_em | timestamptz | |

### ordens_servico
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| numero | serial | número sequencial legível, usado no portal público |
| cliente_id | uuid | FK → clientes |
| aparelho_marca | text | ex.: Samsung |
| aparelho_modelo | text | ex.: Galaxy A14 |
| aparelho_imei | text | opcional |
| senha_aparelho | text | **sensível** — acesso restrito, ver regras |
| defeito_relatado | text | o que o cliente descreveu |
| diagnostico | text | o que o técnico achou (opcional) |
| servico_realizado | text | o que foi feito (opcional) |
| status | text (enum) | ver seção 6 |
| valor_peca | numeric(10,2) | default 0 |
| valor_mao_obra | numeric(10,2) | default 0 |
| valor_total | numeric(10,2) | = valor_peca + valor_mao_obra (calculado) |
| garantia_dias | int | default 90 |
| data_entrada | timestamptz | default now() |
| data_conclusao | timestamptz | quando ficou "pronto" (opcional) |
| data_entrega | timestamptz | quando o cliente retirou (opcional) |
| atualizado_em | timestamptz | |

> No MVP os dados do aparelho ficam direto na OS para simplificar. Na Fase 2, quando
> o histórico de aparelhos por cliente virar prioridade, extrair uma tabela
> `aparelhos` e referenciar por `aparelho_id`.

### pecas
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| nome | text | ex.: Tela Galaxy A14 |
| modelo_compativel | text | opcional |
| custo | numeric(10,2) | quanto você pagou |
| preco_venda | numeric(10,2) | quanto você cobra |
| quantidade | int | default 0 |
| criado_em | timestamptz | |

### movimentacoes_caixa
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| tipo | text (enum) | `entrada` \| `saida` |
| categoria | text | ex.: servico, compra_peca, despesa |
| descricao | text | |
| valor | numeric(10,2) | sempre positivo; o `tipo` define o sinal |
| ordem_servico_id | uuid | FK → ordens_servico (opcional) |
| data | timestamptz | default now() |
| criado_em | timestamptz | |

### Relações
- `ordens_servico.cliente_id` → `clientes.id`
- `movimentacoes_caixa.ordem_servico_id` → `ordens_servico.id` (opcional)

## 6. Fluxo de status da OS

O `status` é o coração da experiência. Sequência principal:

```
aguardando_analise → em_analise → orcamento_enviado → aprovado
      → em_conserto → pronto → entregue
```

Ramo alternativo: de `orcamento_enviado`, o cliente pode não aprovar → `recusado`.

Valores do enum: `aguardando_analise`, `em_analise`, `orcamento_enviado`,
`aprovado`, `em_conserto`, `pronto`, `entregue`, `recusado`.

Regras de transição:
- Ao entrar em `pronto`, gravar `data_conclusao`.
- Ao entrar em `entregue`, gravar `data_entrega` (é daqui que a garantia conta).
- Cada mudança de status deve permitir disparar o aviso de WhatsApp (principalmente
  ao chegar em `pronto`).

## 7. Módulos e funcionalidades

### Ordem de serviço (núcleo)
- Criar OS escolhendo/cadastrando cliente na hora, preenchendo aparelho e defeito.
- Editar diagnóstico, serviço, valores e status.
- Mudar status com um seletor claro; ações de status geram data e/ou aviso.
- Botão "avisar no WhatsApp" que abre `wa.me` com mensagem pronta.
- Botão "gerar PDF" (OS + termo de garantia com a marca).
- Filtro da lista por status (ex.: ver só "pronto" para saber o que entregar).

### Clientes
- CRUD de clientes.
- Página do cliente com histórico de todas as OS dele.

### Peças / estoque
- CRUD de peças com custo, preço de venda e quantidade.
- No começo o fluxo é "compra sob demanda"; o estoque serve pra registrar o que
  gira. Não bloquear criação de OS por falta de peça cadastrada.

### Financeiro / caixa
- Registrar entradas (pagamento de serviço) e saídas (compra de peça, despesa).
- Quando uma OS é entregue e paga, criar (ou sugerir) uma entrada ligada à OS.
- Relatório: faturamento do mês, total de saídas, lucro, e **lucro por OS**
  (separando peça de mão de obra — quase sempre a mão de obra é a maior margem).

### Garantia
- Cada OS tem `garantia_dias` (default 90) contados da `data_entrega`.
- Listar OS ainda dentro da garantia e destacar retornos.

### Portal do cliente (público)
- `/acompanhar`: campo pra digitar o número da OS.
- `/acompanhar/[numero]`: mostra **apenas** status, marca/modelo do aparelho e uma
  linha do tempo simples. **Nunca** mostrar valores, senha do aparelho, telefone,
  CPF ou qualquer dado sensível.

### Dashboard
- Visão geral: OS abertas por status, faturamento do mês, ticket médio, serviços
  mais comuns, aparelhos que mais aparecem.

## 8. Diferenciais (o que torna esse sistema melhor que caderno/planilha)
1. **Portal público de status** — reduz o "e aí, já ficou?" e passa profissionalismo.
2. **WhatsApp com um clique** — aviso de "pronto" sem digitar do zero.
3. **PDF com a marca** — OS e garantia impressas/enviadas com a cara da E&S Tech.
4. **Lucro por OS** — enxergar de verdade qual serviço dá mais margem.

## 9. Roadmap por fases

Construir **em ordem**. Não começar uma fase sem a anterior rodando de verdade.

### Fase 1 — MVP (usar desde o primeiro cliente)
- [ ] Auth com um usuário admin (o dono).
- [ ] CRUD de clientes.
- [ ] CRUD de ordens de serviço com status.
- [ ] Lista de OS com filtro por status.
- [ ] Caixa simples (entradas/saídas manuais).
- [ ] Dashboard básico (contagem de OS por status + faturamento do mês).

### Fase 2 — profissionalização
- [ ] Portal público de acompanhamento (`/acompanhar`).
- [ ] Botão de WhatsApp com mensagem pronta.
- [ ] Geração de PDF da OS e do termo de garantia com a marca.
- [ ] Módulo de peças / estoque.
- [ ] Relatórios financeiros com lucro por OS.

### Fase 3 — escala
- [ ] Múltiplos usuários (técnicos) com permissões.
- [ ] Controle de garantia com alertas de prazo.
- [ ] Orçamentos separados que viram OS quando aprovados.
- [ ] Gráficos avançados no dashboard.
- [ ] Rotina de backup dos dados.

## 10. Regras de negócio
- `valor_total = valor_peca + valor_mao_obra`.
- A garantia conta a partir de `data_entrega`, por `garantia_dias`.
- O portal público expõe só status + aparelho. Tudo mais é privado.
- `senha_aparelho` é dado sensível: exibir só na tela de detalhe da OS (área
  privada), nunca no portal, nunca em PDF público, nunca em logs.
- Não impedir a criação de OS por causa de estoque; peça é sob demanda.

## 11. Requisitos não-funcionais
- **Responsivo mobile-first.** Testar tudo primeiro no celular.
- **LGPD.** Dados de clientes (nome, telefone, CPF) e senha do aparelho são
  pessoais/sensíveis. Acesso só autenticado, não expor no portal público, e coletar
  só o necessário.
- **Performance.** Listas de OS precisam carregar rápido mesmo com centenas de
  registros — paginação/limite e índices por `status` e `cliente_id`.
- **Segurança.** Usar Row Level Security do Supabase; a área admin exige sessão
  autenticada; o portal público lê só as colunas permitidas via view/consulta restrita.

## 12. Setup inicial
1. Criar projeto no Supabase; anotar URL e chaves.
2. `npx create-next-app` (TypeScript + Tailwind + App Router).
3. Configurar variáveis de ambiente:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=   # só no servidor, nunca no client
   ```
4. Rodar as migrations (criar as tabelas da seção 5).
5. Criar o usuário admin no Supabase Auth.
6. `npm run dev` e começar pela Fase 1.
7. Deploy na Vercel conectando o repositório.

## 13. Instruções para o agente de código
- Trate este README como a especificação. Ao implementar, siga o roadmap da seção 9
  **em ordem** — entregue a Fase 1 funcional antes de tocar na Fase 2.
- Antes de criar uma tela nova, confirme que a tabela e os tipos correspondentes
  existem (seção 5). Gere os tipos TypeScript a partir do schema do Supabase.
- Priorize o fluxo "criar OS" ponta a ponta antes de qualquer refinamento visual:
  é o caminho mais usado do sistema.
- Ao adicionar um recurso, comece pelo caminho feliz mais simples e só depois trate
  os casos de borda. Comente decisões não óbvias.
- Nunca exponha `senha_aparelho`, valores ou dados de contato no portal público.
- Mantenha os componentes pequenos e reutilizáveis; centralize a formatação de
  moeda (R$) e telefone em `/lib`.