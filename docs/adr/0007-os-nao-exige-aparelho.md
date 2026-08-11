---
status: accepted
---

# A OS é ancorada no trabalho, não no aparelho

O modelo original tratava a OS como "o aparelho que entrou": marca, modelo e IMEI eram obrigatórios, e o campo de abertura era `defeito_relatado`. Isso quebra em três casos reais da E&S: atender em domicílio, dar suporte remoto, e montar um PC com peças que o cliente comprou. Nesses casos não há aparelho na bancada — e um formulário que exige um obriga a cadastrar "aparelho: N/A", que é o sintoma clássico de modelo errado.

Decidido: a OS é ancorada no trabalho. `aparelho_tipo`, `aparelho_modelo` e `aparelho_identificador` são todos opcionais, e o que a OS exige é cliente e Tipo de serviço. Confere com o padrão do setor — em ferramentas como RepairShopr o ticket é o centro e o aparelho é atributo dele.

## Consequences

- Toda tela que mostra dados do aparelho precisa tratar o caso de não haver nenhum — inclusive o portal público, que hoje mostra marca/modelo.
- `defeito_relatado` deixa de ser o nome certo do campo de abertura: "quero formatar" não é defeito. Vira uma solicitação.
- Identificação do aparelho, quando existe, é `aparelho_tipo` (celular, notebook, desktop, tablet, outro) + `aparelho_identificador` em texto livre, que guarda IMEI ou número de série conforme o tipo.
