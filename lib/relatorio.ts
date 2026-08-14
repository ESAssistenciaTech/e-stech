/**
 * Apuração de lucro.
 *
 * Lucro aqui é o resultado apurado — não a Margem, que é a regra de
 * precificação (ver CONTEXT.md). Nada disto é armazenado: os números vêm da
 * view `ordens_servico_totais` e são somados na hora de mostrar.
 */

/** Uma OS entregue, como a view devolve. Os numéricos podem vir como texto. */
export type LinhaLucro = {
  id: string;
  numero: number;
  codigo_publico: string;
  valor_mao_obra: number | string;
  valor_total: number | string;
  custo_peca: number | string;
  lucro: number | string;
  data_entrega: string | null;
};

export type Apuracao = {
  quantidade: number;
  faturamento: number;
  maoObra: number;
  /** O que foi cobrado de peça: faturamento menos mão de obra. */
  vendaPeca: number;
  custoPeca: number;
  lucro: number;
  /**
   * OS que cobraram peça e não registraram o custo dela. O lucro delas sai
   * inflado, e sem contar quantas são o total inteiro fica sem crédito.
   */
  semCusto: number;
};

/**
 * Soma as linhas do período.
 *
 * `lucro` é somado da view, não recalculado: a conta mora num lugar só, e
 * duas versões dela um dia divergem.
 */
export function apurar(linhas: LinhaLucro[]): Apuracao {
  const total: Apuracao = {
    quantidade: linhas.length,
    faturamento: 0,
    maoObra: 0,
    vendaPeca: 0,
    custoPeca: 0,
    lucro: 0,
    semCusto: 0,
  };

  for (const l of linhas) {
    const faturamento = Number(l.valor_total);
    const maoObra = Number(l.valor_mao_obra);
    const custo = Number(l.custo_peca);
    const venda = faturamento - maoObra;

    total.faturamento += faturamento;
    total.maoObra += maoObra;
    total.vendaPeca += venda;
    total.custoPeca += custo;
    total.lucro += Number(l.lucro);
    if (venda > 0 && custo === 0) total.semCusto += 1;
  }

  return total;
}

export type LinhaServico = { nome: string; quantidade: number; valor: number };

/**
 * Mão de obra por tipo de serviço — e **só** mão de obra.
 *
 * Não é lucro por serviço, e não dá para ser: o custo da peça é da OS
 * inteira. Numa OS que trocou tela e bateria não existe critério para dizer
 * quanto do custo é de cada uma, e ratear por valor seria inventar um número
 * com cara de apurado. A tela precisa dizer isso em voz alta.
 */
export function porServico(
  itens: { nome: string; valor: number | string }[],
): LinhaServico[] {
  const mapa = new Map<string, LinhaServico>();

  for (const item of itens) {
    const linha = mapa.get(item.nome) ?? {
      nome: item.nome,
      quantidade: 0,
      valor: 0,
    };
    linha.quantidade += 1;
    linha.valor += Number(item.valor);
    mapa.set(item.nome, linha);
  }

  return [...mapa.values()].sort((a, b) => b.valor - a.valor);
}
