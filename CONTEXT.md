# E&S Tech — Assistência Técnica

Sistema de gestão de uma assistência técnica de eletrônicos — celulares e computadores, conserto e outros serviços (formatação, instalação de peça). Contexto único: tudo gira em torno da Ordem de Serviço (OS).

## Language

### Núcleo

**Ordem de Serviço (OS)**:
Registro central de um conserto, do momento em que o aparelho entra até ser entregue. Todo outro módulo (cliente, peça, financeiro, garantia) existe pra dar suporte a ela.
_Avoid_: Chamado, ticket, serviço (sozinho)

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

**Estorno**:
Devolução de dinheiro já recebido, registrada como Movimentação de caixa de saída vinculada à OS. Quanto devolver é decisão humana caso a caso — o sistema pergunta no momento do cancelamento e registra o que foi decidido, sem impor regra.
_Avoid_: Reembolso, devolução

**Venda avulsa**:
Saída de mercadoria no balcão sem conserto envolvido — cliente compra uma película e vai embora. Nunca vira OS: tem itens, quantidade e valor unitário próprios, e é o que dá origem ao cupom fiscal quando ele existir. É aqui, e só aqui, que insumo baixa do estoque.
_Avoid_: OS de venda, pedido

### Garantia

**Retorno**:
Nova OS aberta quando um aparelho volta com o mesmo defeito dentro do prazo de garantia. Aponta pra OS original e nasce com valores zerados. Nunca reabre a OS antiga.
_Avoid_: Reincidência, retrabalho, reabertura

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

**Aparelho doador**:
Aparelho físico específico guardado pra ter peças arrancadas conforme a necessidade. Não tem quantidade: são dois aparelhos distintos, cada um com um estado próprio de canibalização, registrado em anotação livre. A pergunta que se faz dele é "tenho um desse modelo?".
_Avoid_: Sucata, peça, estoque de peças

### Cliente

**Telefone de contato**:
Melhor número pra falar com o cliente sobre a OS. Não precisa ser o número do próprio aparelho em conserto — esse pode estar na loja, sem uso, enquanto o conserto roda. O cliente informa o que for mais confiável pra contato.
_Avoid_: Telefone do aparelho, telefone do cliente (ambíguo)
