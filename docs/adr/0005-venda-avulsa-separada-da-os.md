---
status: accepted
---

# Venda de balcão é entidade própria e itemizada, não uma OS

O sistema nasceu 100% centrado na OS, então venda de mercadoria (uma película aplicada em três minutos) não tinha onde morar. Registrar como OS enche a lista de conserto de lixo — não há defeito, diagnóstico, status nem garantia de reparo. Registrar só como linha de `movimentacoes_caixa` com descrição em texto também não serve: cupom fiscal exige item, quantidade e valor unitário, e retroagir itemização em cima de meses de texto livre é trabalho perdido.

Decidido: `vendas` + `venda_itens`, com painel de venda (PDV) próprio. Cada venda gera automaticamente a movimentação de caixa correspondente. Emissão fiscal segue fora de escope, mas o dado já nasce no formato que ela vai exigir.

Confere com o padrão do setor: em ferramentas como RepairShopr o POS roda em paralelo ao ticket, compartilhando estoque, e venda de balcão nunca vira ticket.

## Consequences

- Baixa de estoque de insumo acontece na venda, nunca na OS.
- Faturamento do mês passa a somar duas origens: OS e vendas. Todo relatório financeiro precisa considerar as duas.
