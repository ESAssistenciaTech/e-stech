# Estado do projeto — E&S Tech

Documento de retomada. Escrito em **13/08/2026**, atualizado em
**14/08/2026** com o relatório de lucro.

Serve para quem chega sem ter acompanhado a construção — inclusive um agente
em sessão nova. Diz onde o projeto está, o que já foi decidido, o que está
esperando ação humana e o que falta construir.

> **Leia primeiro:** `AGENTS.md` → `docs/adr/` → `CONTEXT.md` → `docs/design.md`
> → `inicio.md`. Este arquivo é o *status*; aqueles são a *autoridade*.
> Havendo conflito, o ADR vence e este arquivo é que está velho.

---

## 1. O que o sistema é

Sistema de gestão de uma assistência técnica de eletrônicos — celulares e
computadores. O núcleo é a **Ordem de Serviço (OS)**. Usuário único: o dono,
operando **em pé no balcão, uma mão segurando o aparelho do cliente**. Essa
frase governa quase toda decisão de interface.

Três superfícies: área administrativa (privada), portal de acompanhamento
(público, por código) e landing page (pública, para a bio do Instagram).

**Restrição dura: custo zero.** Vercel, Supabase e Cloudinary, todos no plano
gratuito.

## 2. Stack

| Camada | O quê |
|---|---|
| Front e back | Next.js 16.3 (App Router) + React 19.2 + TypeScript, na Vercel |
| Estilo | Tailwind 4 (tokens em `app/globals.css`) |
| Banco, auth, RLS | Supabase |
| Imagens | Cloudinary (só a URL vai para o banco) |
| QR | pacote `qrcode`, gerado no servidor |

Não existe backend separado: route handlers e server actions **são** o backend.
Ver [ADR 0012](docs/adr/0012-stack-next-vercel-supabase-cloudinary.md).

## 3. O que está pronto

### Fase 1 — completa

Auth e proteção de rota · Dados da loja · Clientes (lista, busca, detalhe com
histórico, edição) · Tipos de serviço (cadastro com categoria, valor e garantia
padrão) · OS (abertura, lista filtrada, detalhe, edição, mudança de status) ·
Caixa (sinal, parcial, quitação, estorno, formas de pagamento) · Painel ·
Exportação CSV.

### Fase 2 — completa

Portal público de acompanhamento · Comprovante impresso com QR · WhatsApp com
modelos editáveis · Cotação de peça com fornecedores · Landing page · Registro
fotográfico (entrada e entrega).

### Fase 3 — começada

**Relatório de lucro** (`/lucro`), alcançável pelo Caixa. Apura por entrega,
não por caixa: a OS entra no período em que foi entregue, mesmo com saldo em
aberto. Mostra a composição (mão de obra + peça vendida − custo da peça), a
mão de obra por tipo de serviço e a lista por OS.

Duas coisas que a tela diz e convém não desfazer:

- **Não existe lucro por tipo de serviço.** `custo_peca` é da OS inteira; numa
  OS com dois serviços não há critério para dividi-lo. Ratear por valor daria
  um número com cara de apurado e sem lastro. Por serviço vai só mão de obra.
- **Lucro não é dinheiro em caixa** e não desconta aluguel nem luz. Quem
  responde "quanto entrou" é o Caixa.

### Rotas existentes

```
públicas   /  ·  /acompanhar  ·  /acompanhar/[codigo]  ·  /login
admin      /dashboard  /os  /os/nova  /os/[id]
           /os/[id]/editar  /os/[id]/fotos  /os/[id]/comprovante
           /clientes  /clientes/novo  /clientes/[id]  /clientes/[id]/editar
           /financeiro  /lucro  /cotacoes  /cotacoes/nova
           /fornecedores  /fornecedores/novo  /fornecedores/[id]
           /servicos  /servicos/novo  /servicos/[id]
           /mensagens  /configuracoes
api        /api/exportar/[tipo]   (ordens | clientes | caixa)
```

### Migrations — 10 aplicadas, a 0011 esperando

```
0001 fase1                    tabelas base, RLS, enums
0002 view_security_invoker    correção de vazamento na view de totais
0003 view_com_status          status na view, para "a receber"
0004 aparelho                 marcas, tipo de senha, "não identificado"
0005 portal_publico           função consultar_os
0006 dados_loja_publicos      loja sem expor a margem
0007 modelos_mensagem         textos do WhatsApp
0008 cotacoes                 fornecedores, peças, qualidades, cotações
0009 servicos_publicos        serviços para a landing, sem preço
0010 os_fotos                 registro fotográfico
0011 view_com_datas           data e custo na view; data de entrega no insert
```

## 4. Pendências de ação humana

Nada disso é código. São passos que só o dono pode dar.

- [ ] **Aplicar a migração `0011_view_com_datas`.** Colar o arquivo no SQL Editor do Supabase, como foi feito com as dez anteriores. Sem ela `/lucro` não carrega: a view ainda não tem `data_entrega` nem `custo_peca`.
- [ ] **Rotacionar o `CLOUDINARY_API_SECRET`.** O segredo atual passou por chat e precisa ser trocado: painel do Cloudinary → Settings → API Keys → Generate New Key. Atualizar `.env.local` e a Vercel, depois desativar o antigo. Há um comentário no `.env.local` lembrando.
- [ ] **Variáveis na Vercel.** As três do Cloudinary (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) precisam estar em Settings → Environment Variables. Sem elas, foto funciona na máquina local e falha no ar.
- [ ] **Preencher `/configuracoes`.** Endereço, horário e telefone. A landing esconde o botão de WhatsApp sem o telefone, e o comprovante sai com cabeçalho vazio.
- [ ] **Preencher os valores em `/servicos`.** Os seis tipos semeados estão com valor zero, e a própria tela avisa. Enquanto estiverem assim, toda OS nasce sem preço.
- [ ] **Cadastrar fornecedores** em Cotações → Fornecedores. Sem eles a tela de registro de cotação não tem onde pôr preço.
- [ ] **Apagar ou trocar a senha do usuário `claude@gmail.com`.** Foi criado para teste e a senha circulou em texto puro.

## 5. Armadilhas descobertas na construção

Coisas que custaram tempo e não estão em nenhum ADR.

**Servidor de dev zumbi.** No Windows, o processo do `next dev` às vezes sobrevive ao encerramento e continua segurando a porta 3000 servindo **código velho**. Sintoma: `npm run dev` avisa `Port 3000 is in use... using available port 3001`, e o navegador em `localhost:3000` mostra uma versão antiga. Isso já gerou um "erro 500" que não existia. Resolver com `npx kill-port 3000`.

**Variável de ambiente exige reinício.** Mexeu no `.env.local`, o servidor de dev **precisa** ser reiniciado — ele lê tudo na subida.

**`"use server"` só exporta função async.** Objetos de estado inicial (`ESTADO_INICIAL`) não podem morar em arquivo de action; vivem em `lib/`. O erro só aparece no build, e a mensagem não é óbvia.

**Insert em lote no PostgREST não usa DEFAULT.** Ao inserir um array, ele monta **um conjunto único de colunas**. Se uma linha traz um campo e outra não, a que não traz recebe `NULL` explícito em vez de cair no `default` — e estoura o `not null`. Todas as linhas de um lote precisam ter as mesmas chaves.

**View no Postgres ignora RLS por padrão.** Toda view criada aqui nasce com `security_invoker = on`. Sem isso ela roda com privilégio do dono e vaza as tabelas de baixo. Já aconteceu uma vez, com valores e lucro expostos a anônimo. Ver [ADR 0012](docs/adr/0012-stack-next-vercel-supabase-cloudinary.md).

**RLS não filtra coluna.** Quando uma tela pública precisa de parte de uma tabela protegida, a saída **não** é abrir a tabela para `anon` — é criar função `security definer` com `search_path` fixo devolvendo campo a campo. Já foi feito três vezes: `consultar_os`, `dados_loja_publicos`, `servicos_publicos`.

**O mês não começa em UTC.** O servidor da Vercel roda em UTC; `new Date()` com `setDate(1)` marca meia-noite de Londres, três horas antes daqui. Uma OS entregue às 21h30 do dia 31 caía no mês seguinte. Recorte de tempo agora sai só de `lib/periodo.ts`, que fixa `-03:00` (o Brasil não tem horário de verão desde 2019). Painel e Caixa já usam de lá — não voltar a montar mês na mão na tela.

**Comparar HTML cru em teste dá falso negativo.** Mordeu quatro vezes. O `Intl` usa espaço não-quebrável (U+00A0) entre `R$` e o número; o React insere `<!-- -->` entre texto estático e expressão no SSR; entidades vêm escapadas. Normalize antes de comparar, ou compare pelos dígitos.

**O `&` no nome da pasta quebrava o npm.** A pasta chamava `e&sTech` e o shell do Windows cortava o caminho no `&`. Já resolvido (renomeada para `e-sTech`), mas não voltar a usar `&` em caminho.

## 6. O que falta — Fase 3

Nada aqui é urgente para o uso diário. A fase existe para quando o negócio
crescer.

| Item | Nota |
|---|---|
| **Venda avulsa / PDV** | Venda de balcão itemizada, fora da OS. É o único lugar que baixa estoque de insumo. Ver [ADR 0005](docs/adr/0005-venda-avulsa-separada-da-os.md). O dono disse que não vai vender insumo no começo |
| **Insumos e lista de compras** | É lista de compras, **não** controle de estoque: quantidade editada à mão e marcação de "precisa repor". Ver [ADR 0006](docs/adr/0006-insumo-e-lista-de-compras-nao-controle-de-estoque.md) |
| **Aparelhos doadores** | Aparelho guardado para canibalizar. Não tem quantidade: cada um é um registro com anotação livre do que já foi arrancado |
| **Múltiplos usuários** | Hoje a policy de RLS é `authenticated` faz tudo. Permissão por papel entra aqui |
| **Limpeza de fotos** | Tela listando OS com garantia vencida que ainda têm foto, ordenadas por espaço, para apagar em lote. O dono quis manual, não automático |

### Fora das fases

- **Emissão fiscal** é não-objetivo declarado. O comprovante impresso **não é nota fiscal** e a tela diz isso. O modelo de venda já nasce itemizado para o dia em que for preciso, mas a emissão está fora
- **Vídeo no registro fotográfico** foi descartado: 30 segundos em 1080p consomem o que 250 fotos comprimidas consumiriam

## 7. Como retomar

```bash
cd C:\Users\sidne\Desktop\e-sTech
npm run dev          # http://localhost:3000
npm test             # 93 testes, ~5s
npm run build        # confere tipos e build antes de commitar
```

O `.env.local` não é versionado. O modelo está em `.env.example`.

## 8. Testes

Rodam no `node --test` do próprio Node 24, que executa `.ts` direto. **Zero
dependência de teste** — sem Vitest, sem Jest, sem tsx. O gancho de resolução
do alias `@/` está em `tests/alias.mjs`, e é `.mjs` de propósito: assim não
entra na checagem de tipos do build.

```
tests/unidade/     funções puras — formato, csv, mensagem, cotação,
                   período, relatório. Sem rede.
tests/seguranca/   fonte.test.ts   lê migrations e telas, sem rede
                   anonimo.test.ts bate no banco sem sessão
```

`npm test` roda tudo e carrega o `.env.local`. `npm run test:unidade` roda só o
que não toca a rede. Sem as variáveis do Supabase no ambiente, os testes de
acesso anônimo **pulam** em vez de falhar — máquina nova e CI sem segredo não
devem ver vermelho por isso.

**O que a suíte trava.** As três garantias que o projeto não pode perder:
anônimo não alcança tabela nenhuma (incluindo a view de totais, que já vazou
uma vez); o comprovante não imprime senha do aparelho nem custo de peça; o
portal devolve só os sete campos de `consultar_os`. Junto com elas, as regras
do `AGENTS.md` viraram teste: toda view com `security_invoker = on`, toda
função `security definer` com `search_path` fixo, nenhuma policy para `anon`
em tabela sensível.

**O que ainda não é coberto:** o caminho autenticado ponta a ponta — abrir OS,
receber pagamento, mudar status pela tela. Isso continua exigindo o padrão
antigo, de script descartável: logar com `@supabase/supabase-js`, montar o
cookie `sb-<ref>-auth-token` como `base64-` + JSON da sessão, e bater nas rotas
com ele. Falta um usuário de teste dedicado para isso virar suíte — e o
`claude@gmail.com`, que servia, é justamente um dos que precisam sumir.

**Ao mexer numa função pura, o teste vem junto.** Foi assim que
`lib/periodo.ts` passou a receber o instante por parâmetro: sem isso não havia
como testar a virada do ano nem as 21h do dia 31, que é exatamente onde os
erros de fuso moram.
