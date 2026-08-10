---
status: accepted
---

# Insumo é lista de compras, não controle de estoque

O óbvio seria estoque com baixa automática: cada cola ou parafuso consumido numa OS decrementa a quantidade. Foi descartado por ser trabalho de bancada que ninguém mantém — registrar item a item durante o conserto para de acontecer em duas semanas, e aí a quantidade no sistema vira mentira, que é pior que não ter número nenhum.

Decidido: quantidade é editada à mão, e o insumo tem uma marcação de Reposição que o dono liga ao perceber que acabou. A tela principal do módulo é a Lista de compras — os insumos marcados —, não um relatório de saldo. Depois de comprar, ele lança as quantidades e a marcação cai.

## Consequences

- Nenhum consumo em OS desconta estoque. A única baixa automática é a de Venda avulsa (ver [ADR 0005](./0005-venda-avulsa-separada-da-os.md)).
- Os números de quantidade são aproximados por natureza. Nenhum relatório financeiro ou de custo pode depender deles.
- Se um dia a precisão importar, a saída é itemizar peça na OS — não automatizar a baixa de consumível.
