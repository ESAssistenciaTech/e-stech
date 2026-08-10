---
status: accepted
---

# Retorno de garantia abre uma OS nova, não reabre a original

Quando um aparelho volta com o mesmo defeito dentro da garantia, a saída óbvia seria voltar a OS original pra `em_conserto`. Foi descartada: reabrir corrompe o histórico (datas de conclusão e entrega, faturamento de um mês já fechado) e apaga a informação de que houve retorno.

Decidido: o retorno vira uma OS nova, com `os_origem_id` apontando pra original e valores zerados. Contar retornos é justamente o número que revela peça ou fornecedor ruim — só existe se cada retorno for um registro próprio.
