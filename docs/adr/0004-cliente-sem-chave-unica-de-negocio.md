---
status: accepted
---

# Cliente não tem chave única de negócio — só `id` e busca boa

CPF e telefone parecem chaves naturais pra cliente, mas nenhum dos dois serve: CPF exigido cria fricção no balcão exatamente onde a venda acontece, e o telefone frequentemente é o do próprio aparelho que está em conserto na loja. Só `nome` é obrigatório.

Decidido: a identidade do cliente é o `id uuid` e nada mais. Não existe constraint única em CPF, telefone ou email. Evitar duplicata é responsabilidade de uma busca que casa nome parcial, telefone e CPF ao mesmo tempo na hora de criar a OS.

## Consequences

- Duplicatas ocasionais são esperadas e aceitas. O custo delas é baixo; o custo de travar o cadastro no balcão é alto.
- **Não "consertar" isso adicionando uma constraint única depois.** Se duplicatas incomodarem, a solução é uma função de mesclar clientes, não obrigatoriedade de campo.
