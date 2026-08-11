---
status: accepted
---

# Tipo de serviço é cadastro editável, não enum

O sistema usa enum em vários lugares (status da OS, tipo de movimentação, forma de pagamento), então o reflexo seria fazer o mesmo com tipo de serviço. Foi descartado: a lista de serviços que uma assistência de eletrônicos pode prestar é grande e não é conhecida de antemão — recuperação de dados, troca de pasta térmica, upgrade de RAM, remoção de vírus, e o que aparecer no mês que vem. Com enum, cada serviço novo vira migration e deploy.

Decidido: tabela `tipos_servico`, gerenciada pelo dono na própria interface. Enum continua sendo a escolha certa para os conjuntos que são de fato fechados e raramente mudam — status da OS é o exemplo.

A tabela carrega o prazo padrão de garantia de cada tipo (conserto 90 dias, formatação 0), copiado para a OS na criação e editável ali. Assim o default é automático sem impedir o ajuste caso a caso.

## Consequences

- Não cadastrar a lista inteira de serviços possíveis de uma vez. Começar pelo que o negócio realmente faz e adicionar conforme aparece.
- Como o prazo é copiado pra OS, mudar o padrão de um tipo não altera OS já abertas — que é o comportamento correto: garantia prometida ao cliente não muda retroativamente.
