/**
 * Recortes de tempo do sistema.
 *
 * O mês da loja começa em São Paulo, não em UTC. O servidor da Vercel roda
 * em UTC, e um `new Date()` com `setDate(1)` marca meia-noite de Londres —
 * três horas antes daqui. Uma OS entregue às 21h30 do dia 31 cairia no mês
 * seguinte, e o dono veria o lucro daquela venda sumir de agosto e
 * reaparecer em setembro sem explicação.
 *
 * O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo
 * e cabe numa string. Se voltar, este arquivo é o único lugar a mexer.
 */
const FUSO_LOJA = "-03:00";

const CALENDARIO_LOJA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Ano e mês pelo relógio da loja. `en-CA` formata como AAAA-MM-DD.
 *
 * O instante entra por parâmetro para que o teste possa fixar a virada do
 * ano e o fim do mês às 21h — que é onde os erros de fuso moram e onde
 * esperar o relógio real chegar não é opção.
 */
function hojeNaLoja(agora: Date) {
  const [ano, mes] = CALENDARIO_LOJA.format(agora).split("-").map(Number);
  return { ano, mes };
}

/**
 * Meia-noite do dia 1º, no fuso da loja, como instante ISO.
 *
 * Aceita mês 0 e 13 e normaliza para dezembro do ano anterior e janeiro do
 * seguinte — assim "mês passado" e "mês que vem" não precisam tratar a
 * virada do ano na chamada.
 */
function primeiroDia(ano: number, mes: number) {
  const anoFinal = ano + Math.floor((mes - 1) / 12);
  const mesFinal = ((((mes - 1) % 12) + 12) % 12) + 1;
  return `${anoFinal}-${String(mesFinal).padStart(2, "0")}-01T00:00:00${FUSO_LOJA}`;
}

/** Início do mês corrente. Usado por toda tela que diz "no mês". */
export function inicioDoMes(agora = new Date()) {
  const { ano, mes } = hojeNaLoja(agora);
  return primeiroDia(ano, mes);
}

export const PERIODOS = ["mes", "passado", "ano", "tudo"] as const;
export type Periodo = (typeof PERIODOS)[number];

export const ROTULO_PERIODO: Record<Periodo, string> = {
  mes: "Este mês",
  passado: "Mês passado",
  ano: "Este ano",
  tudo: "Tudo",
};

export function ehPeriodo(valor: string | undefined): valor is Periodo {
  return PERIODOS.includes(valor as Periodo);
}

/**
 * Intervalo meio-aberto `[inicio, fim)`.
 *
 * Fechar o fim em "23:59:59" perde o último segundo do dia; comparar com
 * `<` o primeiro instante do período seguinte não perde nada.
 * `tudo` devolve nulo nas duas pontas: sem filtro.
 */
export function intervalo(
  periodo: Periodo,
  agora = new Date(),
): {
  inicio: string | null;
  fim: string | null;
} {
  const { ano, mes } = hojeNaLoja(agora);

  switch (periodo) {
    case "mes":
      return { inicio: primeiroDia(ano, mes), fim: primeiroDia(ano, mes + 1) };
    case "passado":
      return { inicio: primeiroDia(ano, mes - 1), fim: primeiroDia(ano, mes) };
    case "ano":
      return { inicio: primeiroDia(ano, 1), fim: primeiroDia(ano + 1, 1) };
    case "tudo":
      return { inicio: null, fim: null };
  }
}
