<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# E&S Tech

Sistema de gestão de uma assistência técnica de eletrônicos. O núcleo é a
Ordem de Serviço (OS).

## Leia nesta ordem, antes de escrever código

1. **`docs/adr/`** — as decisões e o porquê delas. Vence tudo, inclusive este arquivo.
2. **`CONTEXT.md`** — o glossário. Manda no significado dos termos.
3. **`docs/design.md`** — a direção visual. Ler antes de qualquer tela.
4. **`inicio.md`** — o plano de construção: tabelas, fases, setup. Subordinado aos três acima.

Achou contradição entre `inicio.md` e um ADR? O ADR vence — e avise, porque
significa que o `inicio.md` desatualizou.

## Vocabulário no código

Os nomes vêm do `CONTEXT.md`, em português. Não invente sinônimo:

- `solicitacao`, não `defeito` — nem toda OS nasce de um defeito
- `cotacao` (vem do fornecedor) ≠ `orcamento` (vai pro cliente)
- `insumo` (a loja tem em quantidade) ≠ `peca` (catálogo de referência, a loja não tem)

## Armadilhas deste projeto

- **Não guarde valor derivado.** Total, saldo e lucro saem da view `ordens_servico_totais`. Não crie coluna `pago` nem `valor_total` — duas fontes para o mesmo número divergem.
- **Não crie policy de leitura anônima na `ordens_servico`.** A linha carrega senha do aparelho, custo de peça e valores junto do status. O portal público vem por função dedicada, campo a campo.
- **Toda view nasce com `security_invoker = on`.** Sem isso ela roda como dona e ignora o RLS das tabelas de baixo.
- **Rota nova protegida não exige nada.** O `proxy.ts` usa lista de rotas *públicas*: o que não estiver lá já exige sessão.
- **Nunca exponha `senha_aparelho` nem `custo_peca`** fora da área privada — nem em PDF entregue ao cliente, nem em log.
