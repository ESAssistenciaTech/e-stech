# E&S Tech — Assistência Técnica

Sistema de gestão de uma assistência técnica de eletrônicos — celulares e computadores, conserto e outros serviços (formatação, instalação de peça). Contexto único: tudo gira em torno da Ordem de Serviço (OS).

## Language

### Núcleo

**Ordem de Serviço (OS)**:
Registro central de um trabalho feito pra um cliente, do momento em que é aceito até ser entregue. Nasce de um Tipo de serviço, não de um defeito — conserto é só um dos tipos. O aparelho é um *atributo* da OS, não a âncora dela: existe OS sem aparelho nenhum (suporte remoto, serviço em domicílio).
_Avoid_: Chamado, ticket, conserto (sozinho)

**Tipo de serviço**:
Categoria de trabalho que a loja executa — troca de tela, troca de bateria, formatação, limpeza, o que mais aparecer. É **cadastro editável pelo dono**, não lista fixa: a variedade de serviços de uma assistência é grande demais pra ser conhecida de antemão. Carrega o prazo de garantia e o valor padrão daquele tipo, que servem de ponto de partida quando ele entra numa OS.
_Avoid_: Categoria, natureza do serviço

**Categoria**:
Família de aparelho que um Tipo de serviço atende — celular, computador, e o que a loja passar a atender. Serve pra organizar a landing page por "quero consertar meu ___", e é cadastro pelo mesmo motivo que o Tipo de serviço: atender console ou impressora um dia não pode exigir deploy.
_Avoid_: Segmento, linha, área

**Serviço da OS**:
Um trabalho específico executado dentro de uma OS, com seu próprio valor e seu próprio prazo de garantia. **Uma OS tem vários** — trocar a tela e a bateria do mesmo aparelho são dois serviços numa OS só. É daqui que sai o valor de mão de obra da OS, somando as linhas.
_Avoid_: Item da OS, tarefa

**Valor padrão**:
Preço que um Tipo de serviço costuma custar, copiado pra OS na criação pra cortar digitação no caminho mais usado do sistema. Editável nos dois níveis: na OS antes de fechá-la, e no próprio cadastro do tipo. Mudar o padrão do tipo nunca altera OS já abertas.
_Avoid_: Preço de tabela, valor sugerido

**Solicitação**:
O que o cliente pediu, nas palavras dele, no momento da abertura da OS. Substitui "defeito relatado": nem toda OS nasce de defeito — "quero formatar" e "quero upgrade de RAM" são solicitações sem defeito nenhum.
_Avoid_: Defeito relatado, problema, reclamação

**Orçamento**:
Momento da OS em que o valor foi apurado e enviado ao cliente, aguardando aprovação. É um **estado da OS**, não um documento separado: quando há o que orçar, o aparelho já está com a loja e a OS já existe.
_Avoid_: Proposta, cotação (que é outra coisa — preço de fornecedor)

**Número**:
Identificador sequencial legível da OS (campo `numero`), usado internamente pelo dono/admin. Não aparece no portal público.
_Avoid_: Código (ambíguo com Código público)

**Código público**:
Identificador curto e não sequencial de uma OS, usado só no portal público (`/acompanhar/[codigo]`) e no QR code impresso na OS. Existe pra não expor volume/ordem de OS do negócio ao ser adivinhado.
_Avoid_: Número

### Status da OS

**Cancelado**:
Status terminal quando o conserto não segue adiante por motivo que não é rejeição de orçamento — ex.: aparelho irreparável, problema fora do que o sistema resolve, desistência do cliente já em andamento (mesmo depois de aprovado). Alcançável a partir de qualquer status ativo.
_Avoid_: Recusado

**Recusado**:
Status terminal quando o cliente não aprova o orçamento enviado. Único caminho de saída a partir de `orcamento_enviado`.
_Avoid_: Cancelado

### Dinheiro

**Movimentação de caixa**:
Todo evento de dinheiro entrando ou saindo do negócio — pagamento de cliente, compra de peça, despesa. É o único registro de dinheiro do sistema: não existe registro de pagamento em nenhum outro lugar.
_Avoid_: Lançamento, transação, pagamento (sozinho)

**Sinal**:
Pagamento parcial recebido antes do conserto terminar, normalmente pra cobrir peça cara ou serviço pesado. É uma Movimentação de caixa comum, vinculada à OS — não tem tratamento especial.
_Avoid_: Entrada (colide com o tipo `entrada`), adiantamento, caução

**Saldo da OS**:
Quanto ainda falta o cliente pagar: `valor_total` menos a soma das Movimentações de caixa de entrada vinculadas àquela OS. Sempre calculado, nunca armazenado. Uma OS pode ser entregue com saldo aberto — fiado com cliente conhecido é rotina do balcão.
_Avoid_: Valor em aberto, pendência, restante

**Custo da peça**:
Quanto a loja pagou pela peça usada num conserto, registrado na OS. É **dado interno**: nunca aparece no PDF, no portal público nem em qualquer tela vista pelo cliente — mesmo tratamento da senha do aparelho. Sem ele o sistema mostra faturamento, não lucro.
_Avoid_: Valor da peça (esse é o que se cobra do cliente)

**Estorno**:
Devolução de dinheiro já recebido, registrada como Movimentação de caixa de saída vinculada à OS. Quanto devolver é decisão humana caso a caso — o sistema pergunta no momento do cancelamento e registra o que foi decidido, sem impor regra.
_Avoid_: Reembolso, devolução

**Venda avulsa**:
Saída de mercadoria no balcão sem conserto envolvido — cliente compra uma película e vai embora. Nunca vira OS: tem itens, quantidade e valor unitário próprios, e é o que dá origem ao cupom fiscal quando ele existir. É aqui, e só aqui, que insumo baixa do estoque.
_Avoid_: OS de venda, pedido

**Modelo de mensagem**:
Texto pronto de aviso ao cliente no WhatsApp, um por situação — aparelho pronto, orçamento enviado, cobrança de saldo. Cadastro editável na tela, com variáveis que o sistema substitui (`{cliente}`, `{numero}`, `{valor}`). Ajustar o tom de uma mensagem nunca pode custar um deploy.
_Avoid_: Template, notificação

### Estado do aparelho

**Registro de estado**:
Conjunto de fotos do aparelho num momento específico da OS, com data e hora gravadas. Existe em dois momentos — **entrada** e **entrega** — e serve pra encerrar discussão sobre condição: "chegou riscado" na entrada, "saiu quebrado daí" na entrega. É registro do dono, sem assinatura nem confirmação do cliente.
_Avoid_: Laudo, evidência, vistoria, comprovante

### Garantia

**Retorno**:
Nova OS aberta quando um aparelho volta com o mesmo defeito dentro do prazo de garantia. Aponta pra OS original e nasce com valores zerados. Nunca reabre a OS antiga.
_Avoid_: Reincidência, retrabalho, reabertura

**Prazo de garantia**:
Quantidade de dias de cobertura, contados da entrega. Vive em cada Serviço da OS, não na OS inteira: trocar a tela e formatar o mesmo notebook gera coberturas diferentes (90 dias e nenhuma), e um prazo único não teria como expressar as duas.
_Avoid_: Validade, vigência

**A receber**:
Soma dos Saldos de todas as OS já entregues que ainda têm valor em aberto. Aparece como bloco fixo no dashboard, com a lista clicável — é assim que dinheiro fiado não some de vista.
_Avoid_: Inadimplência, pendências, devedores

### Estoque

**Insumo**:
Item consumível comprado em quantidade e usado ou vendido unidade a unidade — película, cola, bateria genérica. Sua identidade é o *tipo*. A pergunta principal que se faz dele não é "quantos eu tenho?" e sim **"o que eu preciso comprar?"**.
_Avoid_: Peça, produto, material

**Reposição**:
Marcação manual de que um insumo acabou ou está no fim e precisa ser comprado. É o dono quem marca, ao perceber na bancada — nenhum consumo é descontado automaticamente.
_Avoid_: Estoque mínimo, alerta de estoque

**Lista de compras**:
Tela que reúne todos os insumos marcados pra Reposição, pra ser consultada na hora de comprar. Depois da compra, as quantidades voltam pelo mesmo lugar e a marcação cai.
_Avoid_: Pedido, requisição, ordem de compra

**Compra de insumo**:
Registro de reabastecimento: sobe a quantidade do insumo **e** lança a saída no caixa no mesmo ato, nunca em telas separadas. Separar os dois garante que um dia um é feito e o outro esquecido — e aí ou o caixa mente ou o estoque mente.
_Avoid_: Entrada de estoque, reposição (que é a marcação, não a compra)

**Aparelho doador**:
Aparelho físico específico guardado pra ter peças arrancadas conforme a necessidade. Não tem quantidade: são dois aparelhos distintos, cada um com um estado próprio de canibalização, registrado em anotação livre. A pergunta que se faz dele é "tenho um desse modelo?".
_Avoid_: Sucata, peça, estoque de peças

### Cotação

**Fornecedor**:
Quem vende peça pra loja. Cadastro simples — o contato de WhatsApp de quem se pergunta preço quando o cliente pede uma peça que a loja não tem.
_Avoid_: Distribuidor, parceiro, vendedor

**Peça**:
Modelo de componente que a loja consegue com um Fornecedor — "Tela iPhone 12", "Bateria Galaxy A14". É catálogo de referência pra Cotação, não registro de estoque: a loja normalmente **não tem** a peça, só sabe onde conseguir. Cadastrada na hora de cotar, com sugestão do que já existe, pra que a busca por histórico de preço não quebre por diferença de grafia.
_Avoid_: Insumo (esse a loja tem em quantidade), produto, material

**Cotação**:
Preço que um Fornecedor cobrou por uma Peça numa Qualidade específica, **numa data**. Existe só pra dar ao dono um número de referência na conversa com o cliente — "na última vez que perguntei, era R$300". A data é parte essencial: preço sem data faz repetir com confiança um número velho.
_Avoid_: Orçamento (é o oposto — orçamento vai pro cliente, cotação vem do fornecedor), preço de custo

**Qualidade**:
Nível de uma peça dentro do mesmo modelo — Incell, OLED, Soft OLED numa tela. Não é peça diferente: é a mesma tela de iPhone 12 em versões que custam e duram diferente. Cadastro editável, porque o mercado inventa nome novo com frequência.
_Avoid_: Tipo, versão, categoria

**Margem**:
Quanto a loja acrescenta sobre o custo do Fornecedor pra chegar no preço dito ao cliente. Tem um padrão global editável, e o valor final é sempre ajustável na hora — a margem de uma tela de iPhone não é a de uma bateria genérica.
_Avoid_: Lucro (que é o resultado apurado, não a regra de precificação), markup

### Loja

**Dados da loja**:
Endereço, horário de funcionamento, telefone e logo da E&S Tech, cadastrados em um só lugar na área administrativa. Alimentam a landing page, o PDF e as mensagens de WhatsApp ao mesmo tempo — mudar o horário de funcionamento não pode custar um deploy nem exigir alterar o mesmo dado em três lugares.
_Avoid_: Configurações, perfil da empresa

### Cliente

**Telefone de contato**:
Melhor número pra falar com o cliente sobre a OS. Não precisa ser o número do próprio aparelho em conserto — esse pode estar na loja, sem uso, enquanto o conserto roda. O cliente informa o que for mais confiável pra contato.
_Avoid_: Telefone do aparelho, telefone do cliente (ambíguo)
