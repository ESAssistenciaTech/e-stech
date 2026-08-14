/**
 * Insumo e lista de compras. Ver ADR 0006 e CONTEXT.md.
 *
 * Insumo (a loja tem em quantidade) não é Peça (catálogo de referência para
 * cotação, a loja não tem). Não misturar os dois vocabulários.
 */

export type Insumo = {
  id: string;
  nome: string;
  /** Editada à mão. Aproximada por natureza — nenhum número financeiro sai daqui. */
  quantidade: number;
  /** Marcação feita na bancada ao perceber que acabou. */
  precisa_repor: boolean;
  observacoes: string | null;
  ativo: boolean;
};

/** Uma linha do formulário de compra: quanto entrou de cada insumo. */
export type ItemComprado = { id: string; quantidade: number };

/**
 * Estados das ações.
 *
 * Moram aqui e não no arquivo de action porque um módulo "use server" só
 * pode exportar função async — exportar um objeto dele quebra o build.
 */
export type EstadoInsumo = { erro: string | null };
export const INSUMO_INICIAL: EstadoInsumo = { erro: null };

export type EstadoCompra = { erro: string | null };
export const COMPRA_INICIAL: EstadoCompra = { erro: null };
