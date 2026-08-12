/** Formatação centralizada. Não repetir Intl solto pelas telas. */

const MOEDA = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function moeda(valor: number | null | undefined) {
  return MOEDA.format(valor ?? 0);
}

const DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function data(iso: string | null | undefined) {
  return iso ? DATA.format(new Date(iso)) : "—";
}

export function dataHora(iso: string | null | undefined) {
  return iso ? DATA_HORA.format(new Date(iso)) : "—";
}

/** Código público em blocos: mais fácil de ditar por telefone. */
export function codigo(valor: string) {
  return valor.length === 6 ? `${valor.slice(0, 3)}-${valor.slice(3)}` : valor;
}

/** Guardamos só dígitos; a exibição é que ganha máscara. */
export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function telefone(valor: string | null | undefined) {
  const d = soDigitos(valor ?? "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor ?? "—";
}

/** Dias corridos desde uma data. Usado no "parado há N dias". */
export function diasDesde(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86_400_000);
}
