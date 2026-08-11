---
status: accepted
---

# Cotação é material de consulta e não se conecta à OS

O fluxo real do balcão: o cliente pede uma peça que a loja não tem, o dono pergunta o preço a alguns fornecedores no WhatsApp, e cada um responde com variantes de qualidade a preços diferentes. Guardar essas respostas serve pra que, no próximo cliente que pedir a mesma peça, já exista um número de referência pra conversa — "na última vez que perguntei, a OLED estava R$600".

Decidido: cotação é `(fornecedor, peça, qualidade, preço, data)`, empilhada e nunca sobrescrita, e **não tem nenhuma ligação com a OS**. A tentação óbvia é fazer a cotação escolhida virar o custo e o valor da peça na OS automaticamente. Foi rejeitada pelo dono: cotação é só um número de referência pra falar com o cliente, não um passo do fluxo de trabalho. O preço real da peça naquele conserto pode ter sido outro, negociado na hora.

## Consequences

- **Não wire a cotação na OS depois "pra facilitar".** Ela deixaria de ser referência e viraria compromisso, obrigando a cotar antes de abrir OS.
- Como a cotação não alimenta a OS, o custo da peça na OS continua sendo digitado à mão — é o único caminho para o lucro por OS.
- Empilhar em vez de sobrescrever também mostra fornecedor que subiu preço ao longo do tempo, de graça.
- Fornecedor sem estoque no momento não é registrado: estar sem uma peça hoje não diz nada sobre amanhã, e perguntar de novo é barato.
