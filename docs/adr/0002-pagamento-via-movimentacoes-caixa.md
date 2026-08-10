---
status: accepted
---

# Pagamento de OS é modelado só como movimentação de caixa

A assistência precisa cobrar sinal e receber parcial (serviços pesados às vezes exigem metade adiantado), então "pago sim/não" na OS não serve. As opções eram uma tabela `pagamentos` dedicada, uma coluna `pago`/`valor_pago` em `ordens_servico`, ou reaproveitar `movimentacoes_caixa`, que já tem `ordem_servico_id` opcional.

Decidido: cada sinal, parcial ou quitação é uma linha de `movimentacoes_caixa` do tipo `entrada` vinculada à OS. O saldo da OS é sempre calculado (`valor_total` menos a soma dessas entradas) — não existe coluna `pago` nem `valor_pago` em `ordens_servico`.

## Consequences

- Não há como o caixa e o status de pagamento da OS divergirem: são o mesmo dado.
- Toda listagem que mostra situação de pagamento precisa agregar `movimentacoes_caixa`. Se ficar lento com centenas de OS, a saída é cache/índice — nunca uma coluna paralela, que reabriria o risco de divergência.
- `movimentacoes_caixa` ganha `forma_pagamento` (`dinheiro` | `pix` | `cartao` | `outro`) pra bater o caixa com o mundo real.
