/** Vocabulário do caixa. Ver CONTEXT.md — Movimentação de caixa. */

export const FORMAS_PAGAMENTO = ["dinheiro", "pix", "cartao", "outro"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const ROTULO_FORMA: Record<FormaPagamento, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  outro: "Outro",
};

export const CATEGORIAS_ENTRADA = ["servico", "venda", "outro"] as const;
export const CATEGORIAS_SAIDA = [
  "compra_peca",
  "compra_insumo",
  "despesa",
  "estorno",
] as const;

export const ROTULO_CATEGORIA: Record<string, string> = {
  servico: "Serviço",
  venda: "Venda",
  outro: "Outro",
  compra_peca: "Compra de peça",
  compra_insumo: "Compra de insumo",
  despesa: "Despesa",
  estorno: "Estorno",
};

export type Movimentacao = {
  id: string;
  tipo: "entrada" | "saida";
  categoria: string;
  descricao: string | null;
  valor: number;
  forma_pagamento: FormaPagamento;
  ordem_servico_id: string | null;
  data: string;
};
