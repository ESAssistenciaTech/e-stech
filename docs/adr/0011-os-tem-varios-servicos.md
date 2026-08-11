---
status: accepted
---

# Uma OS tem vários serviços, cada um com sua garantia

Primeiro decidimos que cada OS teria um único tipo de serviço, com os demais descritos em texto livre — a intenção era evitar itemização que ninguém mantém. A decisão caiu diante de um caso trivial: trocar a tela (90 dias de garantia) e formatar (nenhuma) o mesmo notebook. Com um prazo único na OS, 90 dias dá garantia de formatação sem querer e 0 tira a garantia da tela recém-trocada. Não existe número certo — o modelo é que estava errado.

Decidido: tabela `os_servicos` com `(tipo_servico, valor, garantia_dias)` por linha. O valor de mão de obra da OS é a soma das linhas, e a garantia deixa de existir no nível da OS.

O argumento que rejeitou itemizar consumíveis ([ADR 0006](./0006-insumo-e-lista-de-compras-nao-controle-de-estoque.md)) não se aplica aqui: lá eram dezenas de itens de valor baixo (cola, parafuso) que nunca seriam digitados no balcão. Aqui são um a três serviços de valor alto, cujo preço já é digitado de qualquer forma.

## Consequences

- Não existe `garantia_dias` em `ordens_servico`. Toda pergunta sobre garantia é por serviço.
- O PDF e o termo de garantia listam serviço a serviço, com o prazo de cada um — os que têm prazo zero não geram linha de garantia.
- `valor_mao_obra` na OS passa a ser derivado, não digitado.
