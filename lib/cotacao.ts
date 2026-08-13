export type Fornecedor = {
  id: string;
  nome: string;
  telefone: string | null;
  observacoes: string | null;
  ativo: boolean;
};

export type Peca = {
  id: string;
  nome: string;
  modelo_compativel: string | null;
};

export type Qualidade = {
  id: string;
  nome: string;
  ordem: number;
  ativa: boolean;
};

export type UltimaCotacao = {
  id: string;
  peca_id: string;
  qualidade_id: string;
  fornecedor_id: string;
  preco: number;
  data: string;
  peca_nome: string;
  modelo_compativel: string | null;
  qualidade_nome: string;
  qualidade_ordem: number;
  fornecedor_nome: string;
  fornecedor_telefone: string | null;
};

/**
 * Preço a dizer para o cliente: custo do fornecedor mais a margem da loja.
 *
 * Arredonda para cima na dezena — número quebrado no balcão soa a cálculo
 * feito na hora, e é justamente o que a cotação existe para evitar.
 */
export function comMargem(custo: number, margemPercentual: number) {
  const bruto = custo * (1 + margemPercentual / 100);
  return Math.ceil(bruto / 10) * 10;
}

/**
 * Quanto tempo faz que o preço foi visto.
 *
 * A idade é parte da informação: repetir com confiança um número de quatro
 * meses atrás é pior do que dizer "vou confirmar e te falo".
 */
export function idadeCotacao(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (dias === 0) return { texto: "hoje", velha: false };
  if (dias === 1) return { texto: "ontem", velha: false };
  if (dias < 30) return { texto: `há ${dias} dias`, velha: false };
  const meses = Math.floor(dias / 30);
  return {
    texto: meses === 1 ? "há 1 mês" : `há ${meses} meses`,
    // Passando de dois meses o preço já não serve para prometer nada.
    velha: dias >= 60,
  };
}
