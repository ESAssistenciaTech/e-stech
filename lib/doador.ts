import type { TipoAparelho } from "@/lib/tipos";

/**
 * Aparelho doador. Ver CONTEXT.md.
 *
 * Não tem quantidade: dois do mesmo modelo são dois registros, porque cada um
 * está num estado diferente de canibalização. A pergunta que se faz dele é
 * "tenho um desse modelo?", e a resposta é um aparelho, não um número.
 */
export type Doador = {
  id: string;
  modelo: string;
  marca: string | null;
  tipo: TipoAparelho | null;
  identificador: string | null;
  /** O que já foi arrancado, em texto livre. */
  anotacoes: string | null;
  esgotado: boolean;
};

/**
 * Mora aqui e não no arquivo de action porque um módulo "use server" só pode
 * exportar função async — exportar um objeto dele quebra o build.
 */
export type EstadoDoador = { erro: string | null };
export const DOADOR_INICIAL: EstadoDoador = { erro: null };

/** Como o aparelho aparece na lista, com o que estiver preenchido. */
export function descrever(d: Doador) {
  return [d.marca, d.modelo].filter(Boolean).join(" ") || d.modelo;
}
